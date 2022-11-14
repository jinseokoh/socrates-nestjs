import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { NumberData } from 'src/common/types/number-data.type';
import { CouponsService } from 'src/domain/coupons/coupons.service';
import { SyncCouponUsersDto } from 'src/domain/grants/dto/sync-coupon-users.dto';
import { Grant } from 'src/domain/grants/grant.entity';
import { GrantsService } from 'src/domain/grants/grants.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('coupons')
export class GrantsCouponsController {
  constructor(
    private readonly grantsService: GrantsService,
    private readonly couponsService: CouponsService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @Post(':couponId/users')
  @ApiOperation({ description: '관리자) 쿠폰 Batch 제공' })
  async grant(
    @Param('couponId') id: number,
    @Body() dto: SyncCouponUsersDto,
  ): Promise<any> {
    await this.grantsService.sync(id, dto.userIds);
    return { data: true };
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Get(':couponId/users')
  @ApiOperation({ description: '쿠폰 제공한사용자 리스트 w/ Pagination' })
  async list(
    @Param('couponId') couponId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    await this.couponsService.findById(couponId);
    return await this.grantsService.findAllUsers(couponId, query);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '쿠폰 박탈' })
  @Delete(':couponId/users/:userId')
  async detach(
    @Param('couponId') couponId: number,
    @Param('userId') userId: number,
  ): Promise<NumberData> {
    const { affectedRows } = await this.grantsService.detach(couponId, userId);
    return { data: affectedRows };
  }
}
