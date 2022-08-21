import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { Coupon } from 'src/domain/coupons/coupon.entity';
import { CreateCouponDto } from 'src/domain/coupons/dto/create-coupon.dto';
import { UpdateCouponDto } from 'src/domain/coupons/dto/update-coupon.dto';
import { User } from 'src/domain/users/user.entity';
import { Repository } from 'typeorm';
@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly repository: Repository<Coupon>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.repository.create(dto);
    return await this.repository.save(coupon);
  }

  async findById(id: number, relations: string[] = []): Promise<Coupon> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  public findAll(query: PaginateQuery): Promise<Paginated<Coupon>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id', 'name', 'discount'],
      searchableColumns: ['name'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        code: [FilterOperator.EQ],
      },
    });
  }

  async update(id: number, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.repository.preload({ id, ...dto });
    if (!coupon) {
      throw new NotFoundException(`coupon #${id} not found`);
    }
    return await this.repository.save(coupon);
  }

  // note that we don't necessarily have soft-delete API on coupon
  async remove(id: number): Promise<Coupon> {
    const coupon = await this.findById(id);
    return await this.repository.remove(coupon);
  }
}
