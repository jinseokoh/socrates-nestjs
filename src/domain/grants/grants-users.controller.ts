import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { NumberData } from 'src/common/types/number-data.type';
import { CouponsService } from 'src/domain/coupons/coupons.service';
import { Grant } from 'src/domain/grants/grant.entity';
import { GrantsService } from 'src/domain/grants/grants.service';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class GrantsUsersController {
  constructor(
    private readonly grantsService: GrantsService,
    private readonly couponsService: CouponsService,
  ) {}

  @ApiOperation({ description: '쿠폰 제공' })
  @Post(':userId/coupons/:couponId')
  async grant(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('userId') userId: number,
    @Param('couponId') couponId: number,
  ): Promise<Grant> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    await this.couponsService.findById(couponId);
    return await this.grantsService.grant(userId, couponId);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '사용할 수 있는 쿠폰 리스트 w/ Pagination' })
  @Get(':userId/coupons')
  async list(
    @CurrentUserId() id: number,
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    return await this.grantsService.findValidCoupons(userId, query);
  }

  @ApiOperation({ description: '쿠폰 유효성 체크' })
  @Get(':userId/coupons/:couponId')
  async check(
    @Param('userId') userId: number,
    @Param('couponId') couponId: number,
  ): Promise<any> {
    try {
      const coupon = await this.couponsService.findById(couponId);
      if (coupon.expiredAt) {
        const now = new Date().getTime();
        const expiredAt = coupon.expiredAt.getTime();
        if (now >= expiredAt) {
          throw new BadRequestException(`coupon expired`);
        }
      }
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
    const grant = await this.grantsService.findOrFail(userId, couponId);
    if (grant.couponUsedAt) {
      throw new BadRequestException(`coupon already used`);
    }

    return { data: true };
  }

  @ApiOperation({ description: '쿠폰 사용' })
  @Put(':userId/coupons/:couponId')
  async use(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('userId') userId: number,
    @Param('couponId') couponId: number,
  ): Promise<Grant> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    await this.couponsService.findById(couponId);
    return await this.grantsService.use(userId, couponId);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '쿠폰 박탈' })
  @Delete(':userId/coupons/:couponId')
  async detach(
    @CurrentUserId() id: number,
    @Param('userId') userId: number,
    @Param('couponId') couponId: number,
  ): Promise<NumberData> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const { affectedRows } = await this.grantsService.detach(couponId, userId);
    return { data: affectedRows };
  }
}
