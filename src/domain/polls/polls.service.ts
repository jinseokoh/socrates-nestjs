import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { LedgerType, QuestionType } from 'src/common/enums';
import { CreateDotDto } from 'src/domain/dots/dto/create-dot.dto';
import { UpdateDotDto } from 'src/domain/dots/dto/update-dot.dto';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { ageToFactionId } from 'src/helpers/age-to-faction';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DotsService {
  private readonly logger = new Logger(DotsService.name);

  constructor(
    @InjectRepository(Dot)
    private readonly repository: Repository<Dot>,
    private dataSource: DataSource, // for transaction
    private eventEmitter: EventEmitter2,
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateDotDto): Promise<Dot> {
    try {
      const factionId = ageToFactionId(dto.age);

      const createDotDto = { ...dto };
      delete createDotDto.age; // age 는 dot 생성때 필요없음.

      const dot = await this.repository.save(
        this.repository.create(createDotDto),
      );

      await this.repository.manager.query(
        'INSERT IGNORE INTO `dot_faction` (dotId, factionId) VALUES (?, ?)',
        [dot.id, factionId],
      );

      return dot;
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Dot>> {
    const config: PaginateConfig<Dot> = {
      relations: ['user', 'factions'],
      sortableColumns: ['id', 'answerCount'],
      searchableColumns: ['slug'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        createdAt: [FilterOperator.LT, FilterOperator.GT],
        'factions.id': [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, this.repository, config);
  }

  // Dot 리스트
  async getActives(age = null): Promise<Array<Dot>> {
    if (!age) {
      return await this.repository.find({
        relations: ['user'],
        where: {
          isActive: true,
        },
      });
    }

    // return await this.repository
    //   .createQueryBuilder('dot')
    //   .leftJoinAndSelect('dot.user', 'user')
    //   .innerJoinAndSelect('dot.factions', 'faction')
    //   .where('faction.id = :factionId', { factionId: ageToFactionId(age) })
    //   .andWhere('dot.isActive = :isActive', { isActive: true })
    //   .getMany();
    return await this.repository.find({
      relations: ['user', 'factions'],
      where: {
        isActive: true,
        factions: {
          id: ageToFactionId(age),
        },
      },
    });
  }

  async getInactives(age = null): Promise<Array<Dot>> {
    if (!age) {
      return await this.repository.find({
        relations: ['user'],
        where: {
          isActive: false,
        },
      });
    }

    return await this.repository.find({
      relations: ['user', 'factions'],
      where: {
        isActive: false,
        factions: {
          id: ageToFactionId(age),
        },
      },
    });
  }

  // Dot 리스트
  async getActivesBySlug(slug: string, age = null): Promise<Array<Dot>> {
    if (!age) {
      return await this.repository.find({
        where: {
          slug: slug,
          isActive: true,
        },
      });
    }

    return await this.repository.find({
      relations: ['user', 'factions'],
      where: {
        slug: slug,
        isActive: true,
        factions: {
          id: ageToFactionId(age),
        },
      },
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Dot> {
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
      this.logger.error(e);
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  // Dot 갱신
  async update(id: number, dto: UpdateDotDto): Promise<Dot> {
    const dot = await this.repository.preload({ id, ...dto });
    if (!dot) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(dot);
  }

  // Dot increment
  async thumbsUp(id: number): Promise<void> {
    try {
      const dot = await this.findById(id, ['user', 'user.profile']);
      await this.repository.increment({ id }, 'up', 1);
      const total = dot.up + dot.down;
      if (total >= 50) {
        if (dot.up < dot.down) {
          await this.repository.softDelete(id);
        }
        if (dot.up > dot.down) {
          await this.repository.manager.query(
            'UPDATE `dot` SET isActive = 1 WHERE id = ?',
            [id],
          );
          if (dot.isActive == false) {
            //? 작성자에게 2코인 제공 보너스 지급
            const newBalance = dot.user.profile?.balance + 2;
            const ledger = new Ledger({
              debit: 2,
              ledgerType: LedgerType.DEBIT_EVENT,
              balance: newBalance,
              note: `발견 정식질문 등록선물 (대상#${id})`,
              userId: dot.userId,
            });
            await this.repository.save(ledger);

            // notification with event listener ------------------------------------//
            const event = new UserNotificationEvent();
            event.name = 'eventNotification';
            event.userId = dot.userId;
            event.token = dot.user.pushToken;
            event.options = dot.user.profile?.options ?? {};
            event.body = `제공한 질문이 정식 등록되어 2코인 선물을 보내 드립니다.`;
            event.data = {
              page: `settings/coin`,
              args: '',
            };
            this.eventEmitter.emit('user.notified', event);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Dot decrement
  async thumbsDown(id: number): Promise<void> {
    await this.repository.increment({ id }, 'down', 1);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedDots(): Promise<void> {
    const items = <Dot[]>[
      //! 최애 ✅
      new Dot({
        slug: 'love',
        help: '최애',
        question: '가장 존경하는 인물이나 멘토가 있다면 누구야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question:
          '가장 좋아하는 유튜브 채널이 뭐야? 생각나는 채널들 전부 말해줘',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question:
          '가장 좋아하는 예능 프로그램이나 TV 시리즈는 뭐야? 기억나는 것 전부 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '가장 재미있게 본 영화나 드라마는 기억나는 것 전부 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '여름과 겨울 둘 중 하나를 고른 다면 어떤 계절이 좋아?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '가장 가보고 싶은 여행지는 어디야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '집·학교·직장을 제외하고 가장 즐겨찾는 장소가 있다면 어디야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '가장 좋아하는 게임은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '가장 좋아하는 가수나 밴드는 누구야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        help: '최애',
        question: '가장 좋아하는 스포츠 경기 혹은 스포츠 팀에 대해 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 가치관 ✅
      new Dot({
        slug: 'wow',
        help: '가치관',
        question: '세상에서 가장 부러운 사람은 누구야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '감정적으로 분노했던 사건이나 뉴스 중, 가장 먼저 떠오르는 건 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question: '이성 친구를 선택할 때 외모와 능력 둘 중 어떤게 더 중요해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '합리적인 소비는 아니지만, 무리해서라도 남들에게 보여지는 값비싼 물건을 소비하는 것이 필요한 것이라 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '일이 잘 안풀리면, 될 때까지 지속적인 노력을 하는 편이야? 아니면 일단 포기하고 다른 방법을 강구하는 편이야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question: '살면서 가장 감사히 여기는 일에는 어떤 것이 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '화가 나면, 그런 사실을 알리고 표출하는 편이야? 아니면 티 안내고 있으면서 속으로 삭이는 편이야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question: '내 인생의 황금기는 언제였다고 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '가장 관심이 있는 사회적 문제나 사회적 책임에 대한 주제는 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '꼭 해보고 싶지만 아직 못해본 일 중 가장 아쉬운 걸 말해줘. 그리고 그걸 위해 지금은 어떤 노력을 하고 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '부(돈)에 대한 나의 포부와 경제적으로 이루고 싶은 목표가 있다면 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question: '내가 멀리하는 친구의 특징은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '심성이 아주 착하지만 무능한 친구, 이기적이지만 능력있고 선의의 경쟁심이 생기는 친구 그 둘 중 하나를 고른다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '직장이나 근무지를 고를 때, 경제적 보상과 워라벨 중, 어떤게 더 중요하다고 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '가장 호감이 가는 스타일의 사람을 영화의 캐릭터로 빗대어 말한다면 누구야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '가장 싫어하는 스타일의 사람을 영화의 빌런 캐릭터로 빗대어 말한다면 누구야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 경험담 ✅
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '지금까지 받은 선물들 중 가장 감동적이고 특별한 선물에 대해 말해줘',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '타인으로부터 받은 도움들 중 가장 감동적인 도움에 대해 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question: '내가 들었던 조언들 중 최악의 조언은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question: '내가 다른 사람에게 베풀었던 최고의 선행에 대해 말해줄래?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '가까운 지인으로부터 상처를 크게 받은 적이 있다면 말해줘. 그 일로 얻은 교훈이 있다면 같이 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '내가 가봤던 여행지 중에서, 누구에게나 추천하고 싶은 감동의 여행지는 어디야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question: '지금까지 보면서 가장 많이 울었던 영화는 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '나의 유년 시절은 다른 사람보다 행복했다고 생각해? 아니면 그 반대야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '지금 떠올리더라도 오싹한 기분이 드는 기이한 초자연현상이나 유사한 경험이 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '투자 등으로 경제적인 손해를 많이 본 경험이 있어? 있다면 그 일로 내 생활에 어떤 변화가 생겼어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '실수를 안하려고 스스로 정한 규칙이나 자기관리 방법이 있다면 말해줘',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question: '과거의 실수나 오류를 통해 얻은, 인생의 교훈이 있다면 말해줘',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '과거에 옳다고 믿던 일이, 지금은 정반대로 여겨지는 경험이 있다면 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '인생 최대의 트라우마라고 여겨질 만큼 안 좋은 경험을 하나만 꼽는다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '화가 나거나 스트레스를 받을때, 진정시킬 수 있는 나만의 힐링법이 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '내가 우울하거나 무기력할 때, 그 슬럼프를 어떻게 극복하였는지 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question: '인생에서 가장 자랑하고 싶은 성취 경험이 무엇인지 궁금해.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '안좋은 습관 중에서, 꾸준한 노력으로 고치거나 극복한 것이 있다면 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '스스로 결심한 목표를 달성해 본 적이 있어? 있다면, 그 경험에 대해 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question:
          '하지 않겠다고 결심했지만, 번번이 실패하는 일이나 버릇이 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        help: '경험',
        question: '지금은 담담하게 말할 수 있는 흑역사 하나만 말한다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 최근 ✅
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 쇼핑한 물건 중에 가장 만족하는 것은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 쇼핑한 물건 중에 가장 후회하는 것은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 친해진 사람이 있으면 어떻게 만난 사람인지 알려줄래?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question:
          '최근에 건강을 위해 새롭게 시작했거나 관심을 갖기 시작한 운동이 있다면 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 관심을 갖게 된 취미활동이 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 시작한 재태크 혹은 경제활동이 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question:
          '최근에 소비했던 내용 중에 먹는것 빼고 가장 높은 비율을 차지한 내용은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 자기 계발을 위해서 배우기 시작한 것이 있다면 알려줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question:
          '최근에 봤던 영화나 드라마 중에서 가장 재밌게 봤던 영화는 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 저지른 가장 후회하는 일은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: false,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question: '최근에 읽었던 책 중에서 가장 유익한 책은 어떤 책이야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        help: '최근',
        question:
          '최근 새롭게 한 일 중에, 예전의 나였더라면 상상도 못할 일을 한 것이 있다면 알려줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 일상에서 필요한 3가지 ✅
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '내가 이 세상에서 가장 중요하다고 여기는 것에는 어떤 것이 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '내가 갖고 있는 것 중에 가장 아끼는 3가지 아이템에 대해서 말해줘',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '내가 갖고 있지 않지만, 가장 갖고 싶은 3가지 아이템에 대해서 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '전화, 문자, 카톡 같이 누구와 연락할 때 사용하는 앱 말고, 그 밖에 앱들 중에 제일 많이 사용하는 앱은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '내가 하면 충분히 경쟁력있게 잘할 수 있을 것 같은 3가지 비즈니스 영역이 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question: '멀리하는 음식이나 음료 3가지를 말한다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question: '언제 떠올리더라도 행복한 장소 3군데를 물어본다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '누구와 함께 하더라도 자신있게 즐길 수 있는 운동종목 3가지를 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '누구와 함께 하더라도 재미있게 즐길 수 있는 취미활동 3가지를 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        help: '일상',
        question:
          '연애 상대를 선택함에 있어서, 그 사람이 반드시 갖춰야 하는 3가지 조건이나 소양이 있다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 가정 ✅
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '시간을 돌릴 수 있다면, 내가 결정했던 것들 중 가장 바꾸고 싶은 건 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '내가 앞으로 일주일 동안만 살 수 있는 운명이라면 죽기 전에 꼭 경험해 보고 싶은 일은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '만일 전생에 내가 동물이었다면, 어떤 동물이었을 것이라 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '만일 타임머신이 만들어진다면 제일 먼저 가보고 싶은 시대와 장소는 어디야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question: '만일 슈퍼히어로가 될 수 있다면, 어떤 슈퍼파워를 갖고 싶어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '만일 당신의 삶이 영화로 만들어 진다면, 그 영화의 장르는 어떤 장르일까?',
        questionType: QuestionType.MULTIPLE_CHOICE,
        isActive: true,
        options: [
          'SF 영화',
          '액션 영화',
          '코미디 영화',
          '스릴러 영화',
          '공포 영화',
          '로맨스 영화',
          '범죄 영화',
          '판타지 영화',
        ],
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question: '유명해지고 싶다면 어떤 분야에서 유명해 지고 싶어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '만약 하루 동안만 성별이 바뀌는 기회가 주어진다면, 어떤 일을 경험해보고 싶어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question:
          '미래의 나에 대해 딱 한가지를 물어볼 수 있는 마법의 구슬이 있다면, 어떤 질문을 하고 싶어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        help: '가설',
        question: '평생을 다른 나라에서 살아야 한다면 어느 나라에서 살고 싶어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 논란 ✅
      new Dot({
        slug: 'devil',
        help: '논란',
        question: '아이를 낳고 키우는 것은 선택사항이야 아니면 의무사항이야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question: '결혼은 반드시 필요하고 합리적인 제도라고 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question:
          '강력범들의 가벼운 처벌수위로 논란이 많은데, 사형제도의 부활이 필요하다고 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question: '동성애에 대한 나의 찬반 의견을 말해줘.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question: '가장 과대평가된 유명인이 있다면 누굴 꼽을 수 있어?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question:
          '세대별, 성별, 정치성향별, 소득별 갈등이 점점 더 심화되는 사회현상의 원인은 뭐라고 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question:
          '흙수저로 태어난다면 아무리 열심히 노력해도 스스로 중산층의 삶을 개척하는 것이 거의 불가능한 사회라고 생각해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question:
          '다수의 이성과 자유로운 교제하는 비혼주의의 삶과, 결혼과 가정을 선택하는 필혼주의의 삶. 둘 중 어떤 걸 선호해?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        help: '논란',
        question: '지금까지 해본 가장 도발적이고 발칙한 상상은 뭐야?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        help: '가치관',
        question:
          '사주가 너무 안 좋다고 하면서 가족이 말린다면, 관계를 끝낼 것 같아? 아니면 무시할 것 같아?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      // more samples
      // '당신의 로맨틱한 꿈이나 판타지 속 이상형은 어떤 모습인가요?',
      // '로맨틱한 분위기에서 빠지면 안되는 가장 중요한 요소가 있다면, 무엇인가요?',
      // '로맨틱한 상황에서 상대방과 함께 나누고 싶은 음료나 음식이 있다면, 무엇인가요?',
      // '로맨틱한 여행을 단둘이 떠날 수 있는 기회가 있다면, 가장 이상적인 여행지와 숙소는 어디인가요?',
      // '1시간 안에 갈 수 있는 가장 비밀스럽고 로맨틱한 장소를 떠올린다면 그 장소는 어디인가요?',
      // '로맨틱한 영화나 소설 속 장면 중 잊지 못할 매력적인 장면을 소개해 주세요.',
      // '이성에게 매력적으로 보이기 위해 사용하는 나만의 비법은 무엇인가요?',
      // '낯선 상대방으로부터 성적 매력을 느낄 때가 있었다면, 어떤 상황이었나요?',
      // '당신을 섹시한 무드로 만드는 특별한 상황이나 분위기가 있다면, 무엇인가요?',
    ];

    //? 순차저장!
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await Promise.all(
        items.map(async (v) => {
          return await queryRunner.manager.save(v);
        }),
      );

      // commit transaction now:
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
