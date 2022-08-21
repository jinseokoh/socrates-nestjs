import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CouponsService } from 'src/domain/coupons/coupons.service';
import { SyncCouponUsersDto } from 'src/domain/grants/dto/sync-coupon-users.dto';
import { Grant } from 'src/domain/grants/grant.entity';
import { GrantsService } from 'src/domain/grants/grants.service';
import { UsersService } from 'src/domain/users/users.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('coupons')
export class GrantsCouponsController {
  constructor(
    private readonly grantsService: GrantsService,
    private readonly couponsService: CouponsService,
    private readonly usersService: UsersService,
  ) {}

  @Post(':couponId/users')
  @ApiOperation({ description: '관리자) 쿠폰 Batch 제공' })
  async grant(
    @Param('couponId') id: number,
    @Body() dto: SyncCouponUsersDto,
  ): Promise<any> {
    await this.grantsService.sync(id, dto);

    return { data: true };
  }

  @Get(':couponId/users')
  @ApiOperation({ description: '쿠폰 보유자 리스트 w/ Pagination' })
  async list(
    @Param('couponId') couponId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    await this.couponsService.findById(couponId);
    return await this.grantsService.findAllUsers(couponId, query);
  }
}
