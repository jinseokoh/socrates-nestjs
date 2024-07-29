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
import { Answer } from 'src/domain/icebreakers/entities/answer.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateAnswerDto } from 'src/domain/icebreakers/dto/create-answer.dto';
import { LoremIpsum } from 'lorem-ipsum';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { S3Service } from 'src/services/aws/s3.service';
import { UpdateAnswerDto } from 'src/domain/icebreakers/dto/update-answer.dto';
import { randomImageName } from 'src/helpers/random-filename';
import { SignedUrl } from 'src/common/types';
import { SignedUrlDto } from 'src/domain/users/dto/signed-url.dto';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { RequestFrom } from 'src/common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';

@Injectable()
export class AnswersService {
  private readonly logger = new Logger(AnswersService.name);

  constructor(
    @InjectRepository(Answer)
    private readonly repository: Repository<Answer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    private eventEmitter: EventEmitter2,
    private readonly s3Service: S3Service,
  ) {}

  //? ----------------------------------------------------------------------- //
  //? Create
  //? ----------------------------------------------------------------------- //

  async create(dto: CreateAnswerDto): Promise<Answer> {
    try {
      const question = await this.questionRepository.findOne({
        where: {
          id: dto.questionId,
        },
      });
      const answer = await this.repository.findOne({
        where: {
          userId: dto.userId,
          questionId: dto.questionId,
        },
      });
      if (answer) {
        //! 수정
        await this.repository.manager.query(
          'INSERT IGNORE INTO `answer` (userId, questionId, choices, answer, images) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE \
  userId = VALUES(`userId`), \
  questionId = VALUES(`questionId`), \
  choices = VALUES(`choices`), \
  answer = VALUES(`answer`), \
  images = VALUES(`images`)',
          [
            dto.userId,
            dto.questionId,
            dto.choices ? JSON.stringify(dto.choices) : null,
            dto.answer,
            dto.images ? JSON.stringify(dto.images) : null,
          ],
        );
        // answer['choices'] = dto.choices;
        // answer['answer'] = dto.answer;
        answer['question'] = question;

        return answer;
      } else {
        //! 생성 (user-friendship.service 와 중복 로직 있지만, transaction 때문에 비슷한 로직으로 다시 구성)
        const answer = await this.repository.save(
          this.repository.create(dto),
        );

        //? 모든 plea 중 지금 나에게 보내온 요청이 있는지 검사
        const pleas = await this.pleaRepository.find({
          relations: ['sender', 'sender.profile', 'recipient'],
          where: {
            recipientId: dto.userId,
            questionId: dto.questionId,
          },
        });

        if (pleas.length > 0) {
          //? plea 가 있다면, plea 상태 갱신
          await Promise.all(
            pleas.map(async (v) => {
              try {
                await this.repository.manager.query(
                  'UPDATE plea SET answerId = ? WHERE id = ?',
                  [answer.id, v.id],
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
        answer['question'] = question;

        return answer;
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //
  async findAll(query: PaginateQuery): Promise<Paginated<Answer>> {
    return await paginate(query, this.repository, {
      relations: ['user', 'user.profile', 'question', 'answer_comments', 'answer_comments.user'],
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
        questionId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        uneasyCount: [FilterOperator.LT, FilterOperator.GT],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'question.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Answer> {
    const includedAnswerComments = relations.includes('answer_comments');
    try {
      return relations.length > 0
        ? await this.repository.findOneOrFail({
            where: { id },
            relations,
            order: includedAnswerComments
              ? {
                  answer_comments: {
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

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  async update(id: number, dto: UpdateAnswerDto): Promise<Answer> {
    const answer = await this.repository.preload({ id, ...dto });
    if (!answer) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(answer);
  }

  //? ----------------------------------------------------------------------- //
  //? UPLOAD
  //? ----------------------------------------------------------------------- //

  // S3 직접 업로드를 위한 signedUrl 리턴
  async getSignedUrl(userId: number, dto: SignedUrlDto): Promise<SignedUrl> {
    const fileUri = randomImageName(dto.name ?? 'answer', dto.mimeType);
    const path = `${process.env.NODE_ENV}/answers/${userId}/${fileUri}`;
    const url = await this.s3Service.generateSignedUrl(path);

    return {
      upload: url,
      image: `https://cdn.mesoapp.kr/${path}`,
    };
  }

  //? ----------------------------------------------------------------------- //
  //? SEED
  //? ----------------------------------------------------------------------- //

  async seedAnswers(): Promise<void> {
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
        const questionId = (v % 120) + 1;
        const userId = randomInt(1, 20);
        const answer = lorem.generateSentences(5);

        const dto = new CreateAnswerDto();
        dto.questionId = questionId;
        dto.userId = userId;
        dto.answer = answer;
        await this.repository.save(this.repository.create(dto));
      }),
    );
  }
}
