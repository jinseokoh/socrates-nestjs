import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreatePaymentDto } from 'src/domain/payments/dto/create-payment.dto';
import { UpdatePaymentDto } from 'src/domain/payments/dto/update-payment.dto';
import { Payment } from 'src/domain/payments/payment.entity';
import { PaymentsService } from 'src/domain/payments/payments.service';
import { InsertDiscountPipe } from 'src/domain/payments/pipes/insert-discount.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({
    description:
      'payment 생성 (orderIds 로 지정한 상품들에 대하여 배송비 제외)',
  })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePaymentDto,
  ): Promise<Payment> {
    return await this.paymentsService.create({ ...dto, userId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'payment 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getPayments(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Payment>> {
    return this.paymentsService.findAll(query);
  }

  @ApiOperation({ description: 'payment 상세보기' })
  @Get(':id')
  async getPaymentById(@Param('id') id: number): Promise<Payment> {
    return await this.paymentsService.findById(id, [
      'orders',
      'orders.auction',
      'destination',
      'grant',
      'user',
    ]);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({
    description:
      '주문 수정; 주문시 (1) 필수사항; 배송지 지정을 위한 destinationId 갱신 (2) 선택사항; 디스카운트 쿠폰 지정을 위한 grantId 갱신이 필요하다.',
  })
  @Patch(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id') id: number,
    @Body(InsertDiscountPipe) dto: UpdatePaymentDto,
  ): Promise<Payment> {
    return await this.paymentsService.update(id, { ...dto, userId });
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '주문 삭제' })
  @Delete(':id')
  async remove(
    @CurrentUserId() userId: number,
    @Param('id') paymentId: number,
  ): Promise<Payment> {
    return await this.paymentsService.remove(paymentId, userId);
  }
}
