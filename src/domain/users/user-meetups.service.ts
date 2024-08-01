import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { ConfigService } from '@nestjs/config';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';

@Injectable()
export class UserMeetupsService {
  private readonly env: any;
  private readonly logger = new Logger(UserMeetupsService.name);

  constructor(
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? My Meetups
  //? ----------------------------------------------------------------------- //

  // 내가 만든 모임 리스트
  async findMyMeetups(
    query: PaginateQuery,
    userId: number,
  ): Promise<Paginated<Meetup>> {
    const queryBuilder = this.meetupRepository
      .createQueryBuilder('meetup')
      .leftJoinAndSelect('meetup.venue', 'venue')
      .leftJoinAndSelect('meetup.user', 'user')
      .leftJoinAndSelect('meetup.room', 'room')
      .leftJoinAndSelect('room.participants', 'participants')
      .where('meetup.userId = :userId', {
        userId,
      });

    const config: PaginateConfig<Meetup> = {
      sortableColumns: ['id'],
      searchableColumns: ['title'],
      defaultLimit: 20,
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //? ----------------------------------------------------------------------- //
  //? 참가신청한 모든 사용자 리스트
  //? ----------------------------------------------------------------------- //

  // 이 모임에 신청한 Join 리스트 (message 를 볼 수 있어야 하므로)
  async loadAllJoiners(meetupId: number): Promise<Join[]> {
    try {
      const meetup = await this.meetupRepository.findOneOrFail({
        where: {
          id: meetupId,
        },
        relations: ['joins', 'joins.user', 'joins.recipient'],
      });
      return meetup.joins.filter((v) => v.recipient.id === meetup.userId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // 이 모임에 초대한 Join 리스트 (message 를 볼 수 있어야 하므로)
  async loadAllInvitees(meetupId: number): Promise<Join[]> {
    try {
      const meetup = await this.meetupRepository.findOneOrFail({
        where: {
          id: meetupId,
        },
        relations: ['joins', 'joins.user', 'joins.recipient'],
      });

      return meetup.joins.filter((v) => v.user.id === meetup.userId);
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  // 내가 만든 Meetup 리스트 (all)
  async loadMyMeetups(userId: number): Promise<Meetup[]> {
    return await this.meetupRepository
      .createQueryBuilder('meetup')
      .innerJoinAndSelect('meetup.venue', 'venue')
      .innerJoinAndSelect('meetup.user', 'user')
      .where({
        userId,
      })
      .getMany();
  }

  // 내가 만든 Meetup Ids 리스트 (all)
  async loadMyMeetupIds(userId: number): Promise<number[]> {
    const items = await this.meetupRepository
      .createQueryBuilder('meetup')
      .where({
        userId,
      })
      .getMany();
    return items.map((v) => v.id);
  }
}
