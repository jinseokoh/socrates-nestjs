import { PartialType } from '@nestjs/swagger';
import { CreateCouponDto } from 'src/domain/coupons/dto/create-coupon.dto';
export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
