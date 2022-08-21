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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Coupon } from 'src/domain/coupons/coupon.entity';
import { CouponsService } from 'src/domain/coupons/coupons.service';
import { CreateCouponDto } from 'src/domain/coupons/dto/create-coupon.dto';
import { UpdateCouponDto } from 'src/domain/coupons/dto/update-coupon.dto';
@UseInterceptors(ClassSerializerInterceptor)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @ApiOperation({ description: '쿠폰 생성' })
  @Post()
  async create(
    @Body()
    dto: CreateCouponDto,
  ): Promise<Coupon> {
    return await this.couponsService.create(dto);
  }

  @ApiOperation({ description: '쿠폰 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getCoupons(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Coupon>> {
    return await this.couponsService.findAll(query);
  }

  @ApiOperation({ description: '쿠폰 상세보기' })
  @Get(':id')
  async getCouponById(@Param('id') id: number): Promise<Coupon> {
    return await this.couponsService.findById(id);
  }

  @ApiOperation({ description: '쿠폰 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateCouponDto,
  ): Promise<Coupon> {
    return await this.couponsService.update(id, dto);
  }

  @ApiOperation({ description: '관리자) 쿠폰 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Coupon> {
    return await this.couponsService.remove(id);
  }
}
