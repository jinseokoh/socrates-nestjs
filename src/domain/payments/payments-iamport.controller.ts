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
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { PaymentMethod, PaymentStatus } from 'src/common/enums';
import { StringData } from 'src/common/types/string-data.type';
import { ArtworksService } from 'src/domain/artworks/artworks.service';
import { GrantsService } from 'src/domain/grants/grants.service';
import { OrdersService } from 'src/domain/orders/orders.service';
import {
  IamportPaymentDto,
  IamportWebhookDto,
} from 'src/domain/payments/dto/iamport-payment.dto';
import { PaymentsService } from 'src/domain/payments/payments.service';
import { UsersService } from 'src/domain/users/users.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('payments')
export class PaymentsIamportController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly grantsService: GrantsService,
    private readonly usersService: UsersService,
    private readonly artworksService: ArtworksService,
  ) {}

  @ApiOperation({
    description: 'Iamport 를 통한 결제정보 입력 및 변조검사',
  })
  @HttpCode(HttpStatus.OK)
  @Post('complete')
  async complete(
    @CurrentUserId() userId: number,
    @Body() dto: IamportPaymentDto,
  ): Promise<StringData> {
    const payment = await this.paymentsService.findByGivenId(dto.merchant_uid);
    const orderIds = payment.orders.map((i) => i.id);
    const paymentResponse = await this.paymentsService.verify(dto);
    const { amount, status } = paymentResponse;
    if (payment.grandTotal !== amount) {
      throw new BadRequestException(`price mismatched`);
    }

    if (status === 'ready') {
      await this._processReadyStatus(payment.id, paymentResponse);
      return { data: 'issued successfully' };
    }

    if (status === 'paid') {
      await this._processPaidStatus(
        payment.id,
        orderIds,
        payment.userId,
        payment.grantId,
        paymentResponse,
      );
      return { data: 'paid successfully' };
    }

    await this._processOtherStatus(
      payment.id,
      orderIds,
      payment.userId,
      paymentResponse,
    );
    throw new BadRequestException(`unknown status`);
  }

  @ApiOperation({
    description: 'Iamport 을 위한 webhook',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async webhook(@Body() dto: IamportWebhookDto) {
    const payment = await this.paymentsService.findByGivenId(dto.merchant_uid);
    const orderIds = payment.orders.map((i) => i.id);
    const paymentResponse = await this.paymentsService.verify(dto);

    if (dto.status === 'cancelled') {
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
        payment.userId,
        payment.grantId,
        paymentResponse,
      );
      return { data: 'paid successfully' };
    }

    await this._processOtherStatus(
      payment.id,
      orderIds,
      payment.userId,
      paymentResponse,
    );
    throw new BadRequestException(`unknown status`);
  }

  //** privates

  // once payment has been made,
  // (1) payment 레코드 갱신
  // (2) order 레코드 갱신 (isPaid to true)
  // (3) user > score 갱신 (+1)
  // (4) artwork > availability 갱신 (sold)
  // (5) optionally, grant > couponUsedAt 갱신
  async _processPaidStatus(
    id: number,
    orderIds: number[],
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
    await this.ordersService.markItPaid(orderIds);
    await this.usersService.increaseScore(userId);
    await this.artworksService.markItSold(orderIds);
    if (grantId) {
      await this.grantsService.useById(grantId);
    }
  }

  // once payment has been canceled,
  // (1) payment 레코드 갱신
  // (2) order 레코드 갱신 (isPaid to false)
  // (3) user > score 갱신 (-1)
  // (4) artwork > availability 갱신 (unknown)
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
    await this.ordersService.markItUnpaid(orderIds);
    await this.usersService.decreaseScore(userId);
    await this.artworksService.markItUnknown(orderIds);
  }

  // once virtual account has been issued,
  // (1) payment 레코드 갱신
  async _processReadyStatus(id: number, paymentResponse: PaymentResponse) {
    const { vbank_num, vbank_date, vbank_name } = paymentResponse;
    const paymentInfo = `가상 계좌 정보 ${vbank_num} ${vbank_date} ${vbank_name}`;
    await this.paymentsService.update(id, {
      paymentInfo,
      payload: paymentResponse,
    });
    // todo. 알림톡, 가상계좌 발급안내 문자메시지 발송
  }

  // for all other failed status
  // (1) payment 레코드 갱신
  // (2) order 레코드 갱신 (isPaid to false)
  // (3) user > score 갱신 (-1)
  // (4) artwork > availability 갱신 (unknown)
  async _processOtherStatus(
    id: number,
    orderIds: number[],
    userId: number,
    paymentResponse: PaymentResponse,
  ) {
    await this.paymentsService.update(id, { payload: paymentResponse });
    await this.ordersService.markItUnpaid(orderIds);
    await this.usersService.decreaseScore(userId);
    await this.artworksService.markItUnknown(orderIds);
  }
}
