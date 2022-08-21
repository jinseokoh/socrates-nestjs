import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreatePaymentDto } from 'src/domain/payments/dto/create-payment.dto';
import { TrackingNumberDto } from 'src/domain/payments/dto/tracking-number.dto';
import { UpdatePaymentDto } from 'src/domain/payments/dto/update-payment.dto';
import { Payment } from 'src/domain/payments/payment.entity';
import { PaymentsService } from 'src/domain/payments/payments.service';
import { InsertDiscountPipe } from 'src/domain/payments/pipes/insert-discount.pipe';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ description: '주문 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePaymentDto,
  ): Promise<Payment> {
    return await this.paymentsService.create({ ...dto, userId });
  }

  @ApiOperation({ description: '내가 생성한 주문 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getPayments(
    @CurrentUserId() userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Payment>> {
    return this.paymentsService.findAll(userId, query);
  }

  @ApiOperation({ description: '주문 상세보기' })
  @Get(':id')
  async getPaymentById(@Param('id') id: number): Promise<Payment> {
    return await this.paymentsService.findById(id, [
      'orders',
      'destination',
      'grant',
    ]);
  }

  @ApiOperation({
    description:
      '주문 수정; 주문시 (1) 필수사항; 배송지 지정을 위한 destinationId 갱신 (2) 선택사항; 디스카운트 쿠폰 지정을 위한 grantId 갱신이 필요하다.',
  })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body(InsertDiscountPipe) dto: UpdatePaymentDto,
  ): Promise<Payment> {
    return await this.paymentsService.update(id, dto);
  }

  @ApiOperation({
    description: '택배정보 입력. 최초 입력시 푸시알림 발송.',
  })
  @Put(':id')
  async track(
    @Param('id') id: number,
    @Body() dto: TrackingNumberDto,
  ): Promise<Payment> {
    return await this.paymentsService.track(id, dto);
  }

  @ApiOperation({ description: '주문 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Payment> {
    return await this.paymentsService.remove(id);
  }
}
