import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateFeedDto } from 'src/domain/feeds/dto/create-feed.dto';
import { LoremIpsum } from 'lorem-ipsum';
import { Dot } from 'src/domain/feeds/entities/dot.entity';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateFeedDto } from 'src/domain/feeds/dto/update-feed.dto';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { RequestFrom } from 'src/common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';

@Injectable()
export class FeedsService {
  private readonly logger = new Logger(FeedsService.name);

  constructor(
    @InjectRepository(Feed)
    private readonly repository: Repository<Feed>,
    @InjectRepository(Dot)
    private readonly dotRepository: Repository<Dot>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    private eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateFeedDto): Promise<Feed> {
    try {
      const dot = await this.dotRepository.findOne({
        where: {
          id: dto.dotId,
        },
      });
      const feed = await this.repository.findOne({
        where: {
          userId: dto.userId,
          dotId: dto.dotId,
        },
      });
      if (feed) {
        //! 수정
        await this.repository.manager.query(
          'INSERT IGNORE INTO `feed` (userId, dotId, choices, answer, images) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  dotId = VALUES(`dotId`), \
  choices = VALUES(`choices`), \
  answer = VALUES(`answer`), \
  images = VALUES(`images`)',
          [
            dto.userId,
            dto.dotId,
            dto.choices ? JSON.stringify(dto.choices) : null,
            dto.answer,
            dto.images ? JSON.stringify(dto.images) : null,
          ],
        );
        // feed['choices'] = dto.choices;
        // feed['answer'] = dto.answer;
        feed['dot'] = dot;

        return feed;
      } else {
        //! 생성 (user-friendship.service 와 중복 로직 있지만, transaction 때문에 비슷한 로직으로 다시 구성)
        const feed = await this.repository.save(
          this.repository.create(dto),
        );

        //? 모든 plea 중 지금 나에게 보내온 요청이 있는지 검사
        const pleas = await this.pleaRepository.find({
          relations: ['sender', 'sender.profile', 'recipient'],
          where: {
            recipientId: dto.userId,
            dotId: dto.dotId,
          },
        });

        if (pleas.length > 0) {
          //? plea 가 있다면, plea 상태 갱신
          await Promise.all(
            pleas.map(async (v) => {
              try {
                await this.repository.manager.query(
                  'UPDATE plea SET feedId = ? WHERE id = ?',
                  [feed.id, v.id],
                );
              } catch (e) {
                console.error(e);
              }
            }),
          );
          //? plea 가 있다면, 자동 친구요청 보내기
          await Promise.all(
            pleas.map(async (v: Plea) => {
              try {
                const pleaId = v.id;
                const requestFrom = RequestFrom.PLEA;
                const message =
                  '요청한 질문에 답변하여 자동발송된 친구신청입니다.';

                await this.repository.manager.query(
                  'INSERT IGNORE INTO `friendship` \
                  (senderId, recipientId, requestFrom, message, pleaId) VALUES (?, ?, ?, ?, ?)',
                  [v.recipientId, v.senderId, requestFrom, message, pleaId],
                );

                // notification with event listener ------------------------------------//
                const event = new UserNotificationEvent();
                event.name = 'friendRequest';
                event.userId = v.sender.id; // 친구신청 받는사람의 id
                event.token = v.sender.pushToken; // 친구신청 받는 사람의 token
                event.options = v.sender.profile?.options ?? {};
                event.body = `${v.recipient.username}님이 요청한 질문에 답변하여 자동으로 친구신청을 받았습니다.`;
                event.data = {
                  page: 'activities/requests',
                  args: 'tab:7',
                };
                this.eventEmitter.emit('user.notified', event);
              } catch (e) {
                console.error(e);
              }
            }),
          );
        }
        feed['dot'] = dot;

        return feed;
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//
  async findAll(query: PaginateQuery): Promise<Paginated<Feed>> {
    return await paginate(query, this.repository, {
      relations: ['user', 'user.profile', 'dot', 'remarks', 'remarks.user'],
      sortableColumns: [
        'id',
        'sympathyCount',
        'smileCount',
        'surpriseCount',
        'sorryCount',
        'uneasyCount',
      ],
      searchableColumns: ['answer'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        dotId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        uneasyCount: [FilterOperator.LT, FilterOperator.GT],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'dot.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Feed> {
    const includedRemarks = relations.includes('remarks');
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
            order: includedRemarks
              ? {
                  remarks: {
                    id: 'DESC',
                  },
                }
              : undefined,
          })
        : await this.repository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateFeedDto): Promise<Feed> {
    const feed = await this.repository.preload({ id, ...dto });
    if (!feed) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(feed);
  }

  //?-------------------------------------------------------------------------//
  //? UPLOAD
  //?-------------------------------------------------------------------------//

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'feed', dto.mimeType);
    const path = `${process.env.NODE_ENV}/feeds/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedFeeds(): Promise<void> {
    const lorem = new LoremIpsum({
      sentencesPerParagraph: {
        max: 8,
        min: 4,
      },
      wordsPerSentence: {
        max: 16,
        min: 4,
      },
    });
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min);

    await Promise.all(
      [...Array(240).keys()].map(async (v: number) => {
        const dotId = (v % 120) + 1;
        const userId = randomInt(1, 20);
        const answer = lorem.generateSentences(5);

        const dto = new CreateFeedDto();
        dto.dotId = dotId;
        dto.userId = userId;
        dto.answer = answer;
        await this.repository.save(this.repository.create(dto));
      }),
    );
  }
}
