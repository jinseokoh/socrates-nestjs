import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from 'src/domain/orders/dto/create-order.dto';
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
