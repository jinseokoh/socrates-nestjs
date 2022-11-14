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
import { Grant } from 'src/domain/grants/grant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GrantsService {
  constructor(
    @InjectRepository(Grant)
    private readonly repository: Repository<Grant>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

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

  async attach(couponId: number, userId: number): Promise<void> {
    await this.repository.manager.query(
      'INSERT IGNORE INTO `grant` (couponId, userId) VALUES (?, ?)',
      [couponId, userId],
    );
  }

  async sync(couponId: number, userIds: number[]): Promise<any> {
    return await Promise.all(
      userIds.map(async (userId: number) => {
        await this.attach(couponId, userId);
      }),
    );
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAllUsers(
    couponId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    const queryBuilder = this.repository
      .createQueryBuilder('grant')
      .innerJoinAndSelect('grant.user', 'user')
      //      .where((user) => 'user.deletedAt IS NULL')
      .where('grant.coupon = :id', { id: couponId });

    const config: PaginateConfig<Grant> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<Grant>(query, queryBuilder, config);
  }

  // 사용할 수 있는 쿠폰 리스트 w/ Pagination
  async findValidCoupons(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Grant>> {
    const queryBuilder = this.repository
      .createQueryBuilder('grant')
      .innerJoinAndSelect('grant.coupon', 'coupon')
      .where('`grant`.couponUsedAt IS NULL')
      .andWhere('`grant`.userId = :userId', { userId })
      .andWhere('coupon.expiredAt > CURRENT_TIMESTAMP');
    const config: PaginateConfig<Grant> = {
      sortableColumns: ['id'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
    };

    return paginate<Grant>(query, queryBuilder, config);
  }

  async findById(id: number, relations: string[] = []): Promise<Grant> {
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  async find(userId: number, couponId: number): Promise<Grant> {
    const grant = await this.repository.findOne({
      couponId: couponId,
      userId: userId,
    });

    return grant;
  }

  async findOrFail(userId: number, couponId: number): Promise<Grant> {
    const grant = await this.repository.findOne({
      couponId: couponId,
      userId: userId,
    });

    if (!grant) {
      throw new NotFoundException(`relationship not found`);
    }

    return grant;
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async use(userId: number, couponId: number): Promise<Grant> {
    const grant = await this.findOrFail(couponId, userId);
    if (grant.couponUsedAt) {
      throw new BadRequestException(`coupon already used`);
    }

    grant.couponUsedAt = new Date();
    return grant.save();
  }

  async useById(id: number): Promise<Grant> {
    const grant = await this.findById(id);
    if (grant.couponUsedAt) {
      throw new BadRequestException(`coupon already used`);
    }

    grant.couponUsedAt = new Date();
    return grant.save();
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async detach(couponId: number, userId: number): Promise<any> {
    return await this.repository.manager.query(
      'DELETE FROM `grant` WHERE couponId = ? AND userId = ?',
      [couponId, userId],
    );
  }
}
