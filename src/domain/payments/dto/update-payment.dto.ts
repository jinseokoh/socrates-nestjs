import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from 'src/domain/payments/dto/create-payment.dto';
export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
