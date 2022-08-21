import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
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

  @ApiOperation({ description: '쿠폰 리스트 (유효한 쿠폰만) w/ Pagination' })
  @Get(':userId/coupons')
  async list(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    return await this.grantsService.findAllValidCoupons(userId, query);
  }

  @ApiOperation({ description: '쿠폰 유효성 체크' })
  @Get(':userId/coupons/:couponId')
  async check(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('userId') userId: number,
    @Param('couponId') couponId: number,
  ): Promise<any> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    const coupon = await this.couponsService.findById(couponId);
    if (coupon.expiredAt) {
      const now = new Date().getTime();
      const expiredAt = coupon.expiredAt.getTime();
      if (now >= expiredAt) {
        throw new BadRequestException(`already expired`);
      }
    }
    const grant = await this.grantsService.find(userId, couponId);
    if (grant.couponUsedAt) {
      throw new BadRequestException(`already used`);
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

  @ApiOperation({ description: '쿠폰 박탈' })
  @Delete(':userId/coupons/:couponId')
  async forfeit(
    @CurrentUserId() id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('userId') userId: number,
    @Param('couponId') couponId: number,
  ): Promise<Grant> {
    if (id !== userId) {
      throw new BadRequestException(`doh! mind your id`);
    }
    await this.couponsService.findById(couponId);
    return await this.grantsService.forfeit(userId, couponId);
  }
}
