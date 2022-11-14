import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaymentResponse } from 'iamport-rest-client-nodejs/dist/response';
import { Public } from 'src/common/decorators/public.decorator';
import { PaymentMethod, PaymentStatus, Status } from 'src/common/enums';
import { OrderType } from 'src/common/enums/order-type';
import { AnyData } from 'src/common/types/any-data.type';
import { AuctionsService } from 'src/domain/auctions/auctions.service';
import { GrantsService } from 'src/domain/grants/grants.service';
import { Order } from 'src/domain/orders/order.entity';
import { OrdersService } from 'src/domain/orders/orders.service';
import {
  IamportPaymentDto,
  IamportWebhookDto,
} from 'src/domain/payments/dto/iamport-payment.dto';
import { PaymentsService } from 'src/domain/payments/payments.service';
import { UsersService } from 'src/domain/users/users.service';
import { IamportService } from 'src/services/iamport/iamport.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('payments')
export class PaymentsIamportController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly auctionsService: AuctionsService,
    private readonly grantsService: GrantsService,
    private readonly iamportService: IamportService,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? API (검증후 일련의 업데이트도 병행)
  //?-------------------------------------------------------------------------//

  @ApiOperation({
    description: 'Iamport 를 통한 결제정보 입력 및 변조검사',
  })
  @HttpCode(HttpStatus.OK)
  @Post('complete')
  async complete(
    // @CurrentUserId() userId: number,
    @Body() dto: IamportPaymentDto,
  ): Promise<AnyData> {
    const payment = await this.paymentsService.findByGivenId(dto.merchant_uid);
    const orderIds = payment.orders.map((i) => i.id);
    const auctionId = payment.orders.find(
      (i: Order) => i.orderType === OrderType.BUYITNOW,
    )?.auctionId;
    const paymentResponse = await this.iamportService.getPaymentResponse(
      dto.imp_uid,
    );
    const { amount, status } = paymentResponse;
    if (payment.grandTotal !== amount) {
      throw new BadRequestException(`price mismatched`);
    }

    if (status === 'failed') {
      await this._processFailedStatus(payment.id, paymentResponse);
      return { data: 'payment failed' };
    }

    if (status === 'ready') {
      await this._processReadyStatus(payment.id, paymentResponse);
      return { data: 'issued successfully' };
    }

    if (status === 'paid') {
      await this._processPaidStatus(
        payment.id,
        orderIds,
        auctionId,
        payment.userId,
        payment.grantId,
        paymentResponse,
      );

      return { data: 'paid successfully' };
    }

    await this._processAllOtherStatus(
      payment.id,
      orderIds,
      payment.userId,
      paymentResponse,
    );

    // todo. sentry.io report
    throw new BadRequestException(`unknown payment status`);
  }

  //?-------------------------------------------------------------------------//
  //? Webhook
  //?-------------------------------------------------------------------------//

  @ApiOperation({
    description: 'Iamport 을 위한 webhook',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async webhook(@Body() dto: IamportWebhookDto) {
    const payment = await this.paymentsService.findByGivenId(dto.merchant_uid);
    const orderIds = payment.orders.map((i) => i.id);
    const auctionId = payment.orders.find(
      (i: Order) => i.orderType === OrderType.BUYITNOW,
    )?.auctionId;

    const paymentResponse = await this.iamportService.getPaymentResponse(
      dto.imp_uid,
    );

    if (dto.status === 'cancelled' || dto.status === 'canceled') {
      await this._processCanceledStatus(
        payment.id,
        orderIds,
        payment.userId,
        paymentResponse,
      );
      return { data: 'payment canceled' };
    }

    if (dto.status === 'ready') {
      await this._processReadyStatus(payment.id, paymentResponse);
      return { data: 'issued v-account successfully' };
    }

    if (dto.status === 'paid') {
      const { amount } = paymentResponse;
      if (payment.grandTotal !== amount) {
        throw new BadRequestException(`price mismatched`);
      }
      await this._processPaidStatus(
        payment.id,
        orderIds,
        auctionId,
        payment.userId,
        payment.grantId,
        paymentResponse,
      );
      return { data: 'paid successfully' };
    }

    await this._processAllOtherStatus(
      payment.id,
      orderIds,
      payment.userId,
      paymentResponse,
    );

    // todo. sentry.io report
    throw new BadRequestException(`unknown payment status`);
  }

  //--------------------------------------------------------------------------//
  // private methods for each supported status
  // not 100% sure if it covers everyting correctly. IAMPORT manual sucks.
  //--------------------------------------------------------------------------//

  // once payment has gone through
  // (1) payment 레코드 갱신
  // (2) order 레코드 갱신
  //     - orderStatus, shipping, shippingComment, and isCombined
  // (3) user > increase payCount
  // (4) todo. slack report maybe?
  // (5) optionally, auction status 갱신 (status to end) cause it's buyItNow
  // (6) optionally, grant > couponUsedAt 갱신
  async _processPaidStatus(
    id: number,
    orderIds: number[],
    auctionId: number | undefined,
    userId: number,
    grantId: number,
    paymentResponse: PaymentResponse,
  ) {
    await this.paymentsService.update(id, {
      payload: paymentResponse,
      pgId: paymentResponse.imp_uid,
      paymentMethod: paymentResponse.pay_method as PaymentMethod,
      paymentStatus: PaymentStatus.paid as PaymentStatus,
      paidAt: new Date().toUTCString(),
    });
    await this.ordersService.updateAfterPayment(id);
    await this.usersService.increasePayCount(userId);
    if (auctionId) {
      await this.auctionsService.setStatus(auctionId, Status.ENDED);
    }
    if (grantId) {
      await this.grantsService.useById(grantId);
    }
  }

  // once payment has been canceled,
  // (1) payment 레코드 갱신
  // (2) order 레코드 갱신 (status to CANCELED)
  // (3) user > decrease payCount
  // (4) todo. slack report maybe?
  // (5) soft delete payment
  async _processCanceledStatus(
    id: number,
    orderIds: number[],
    userId: number,
    paymentResponse: PaymentResponse,
  ) {
    await this.paymentsService.update(id, {
      payload: paymentResponse,
      pgId: paymentResponse.imp_uid,
      paymentStatus: PaymentStatus.canceled,
      canceledAt: new Date().toUTCString(),
    });
    await this.ordersService.updateAfterCancellation(orderIds);
    await this.usersService.decreasePayCount(userId);
    await this.paymentsService.softRemove(id, userId);
  }

  // once payment has been failed,
  // (1) payment 레코드 갱신
  async _processFailedStatus(id: number, paymentResponse: PaymentResponse) {
    await this.paymentsService.update(id, {
      payload: paymentResponse,
      pgId: paymentResponse.imp_uid,
      paymentStatus: PaymentStatus.failed,
    });
  }

  // once virtual account has been issued,
  // (1) payment 레코드 갱신
  async _processReadyStatus(id: number, paymentResponse: PaymentResponse) {
    const { vbank_num, vbank_date, vbank_name } = paymentResponse;
    const paymentInfo = `가상 계좌 정보 ${vbank_num} ${vbank_date} ${vbank_name}`;
    await this.paymentsService.vbank(id, { paymentInfo });
  }

  // for all other unknown status
  // (1) payment 레코드 갱신
  // (2) order 레코드 갱신 (status to WAITING)
  // (3) todo. slack report maybe?
  // (4) soft delete payment
  async _processAllOtherStatus(
    id: number,
    orderIds: number[],
    userId: number,
    paymentResponse: PaymentResponse,
  ) {
    await this.paymentsService.update(id, { payload: paymentResponse });
    await this.ordersService.updateAfterCancellation(orderIds);
    await this.paymentsService.softRemove(id, userId);
  }
}
