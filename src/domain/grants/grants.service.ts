import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { SyncCouponUsersDto } from 'src/domain/grants/dto/sync-coupon-users.dto';
import { Grant } from 'src/domain/grants/grant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GrantsService {
  constructor(
    @InjectRepository(Grant)
    private readonly repository: Repository<Grant>,
  ) {}

  async find(userId: number, couponId: number): Promise<Grant> {
    return await this.repository.findOne({
      couponId: couponId,
      userId: userId,
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Grant> {
    return relations.length > 0
      ? await this.repository.findOneOrFail({
          where: { id },
          relations,
        })
      : await this.repository.findOneOrFail({
          where: { id },
        });
  }

  async grant(userId: number, couponId: number): Promise<Grant> {
    const grant = await this.find(couponId, userId);
    if (grant) {
      throw new BadRequestException(`already granted`);
    }

    const newGrant = this.repository.create({
      couponId,
      userId,
    });
    return await this.repository.save(newGrant);
  }

  async use(userId: number, couponId: number): Promise<Grant> {
    const grant = await this.find(couponId, userId);
    if (!grant) {
      throw new NotFoundException(`relationship does not exist`);
    }
    if (grant.couponUsedAt) {
      throw new BadRequestException(`already used`);
    }

    grant.couponUsedAt = new Date();
    return grant.save();
  }

  async useById(id: number): Promise<Grant> {
    const grant = await this.findById(id);
    if (grant.couponUsedAt) {
      throw new BadRequestException(`already used`);
    }

    grant.couponUsedAt = new Date();
    return grant.save();
  }

  async forfeit(userId: number, couponId: number): Promise<Grant> {
    const grant = await this.find(couponId, userId);
    if (!grant) {
      throw new NotFoundException(`relationship does not exist`);
    }

    return await this.repository.remove(grant);
  }

  async sync(couponId: number, dto: SyncCouponUsersDto): Promise<void> {
    dto.ids.map(async (userId) => {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `grant` (couponId, userId) VALUES (?, ?)',
        [couponId, userId],
      );
    });
  }

  async findAllValidCoupons(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    const queryBuilder = this.repository
      .createQueryBuilder('grant')
      .leftJoinAndSelect('grant.coupon', 'coupon')
      .where('`grant`.couponUsedAt IS NULL')
      .andWhere(
        'coupon.expiredAt IS NULL OR coupon.expiredAt > CURRENT_TIMESTAMP',
      )
      .andWhere('`grant`.userId = :id', { id: userId });

    const config: PaginateConfig<Grant> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<Grant>(query, queryBuilder, config);
  }

  async findAllUsers(
    couponId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    const queryBuilder = this.repository
      .createQueryBuilder('grant')
      .leftJoinAndSelect('grant.user', 'user')
      .where('grant.coupon = :id', { id: couponId });

    const config: PaginateConfig<Grant> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<Grant>(query, queryBuilder, config);
  }
}
