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
import { QuestionType } from 'src/common/enums';
import { CreateDotDto } from 'src/domain/dots/dto/create-dot.dto';
import { UpdateDotDto } from 'src/domain/dots/dto/update-dot.dto';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

@Injectable()
export class DotsService {
  private readonly logger = new Logger(DotsService.name);

  constructor(
    @InjectRepository(Dot)
    private readonly repository: Repository<Dot>,
    private dataSource: DataSource, // for transaction
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  async create(dto: CreateDotDto): Promise<Dot> {
    try {
      return await this.repository.save(this.repository.create(dto));
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Dot>> {
    return await paginate(query, this.repository, {
      relations: ['user'],
      sortableColumns: ['id', 'answerCount'],
      searchableColumns: ['slug'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
    });
  }

  // Dot 리스트
  async getActives(): Promise<Array<Dot>> {
    return await this.repository.find({
      relations: ['user'],
      where: {
        isActive: true,
      },
    });
  }

  async getInactives(): Promise<Array<Dot>> {
    return await this.repository.find({
      relations: ['user'],
      where: {
        isActive: false,
      },
    });
  }

  // Dot 리스트
  async getBySlug(slug: string): Promise<Array<Dot>> {
    return await this.repository.find({
      where: {
        slug: slug,
        isActive: true,
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
    await this.repository.increment({ id }, 'up', 1);
    const dot = await this.findById(id);
    const total = dot.up + dot.down;
    if (total >= 50) {
      if (dot.up < dot.down) {
        await this.repository.softDelete(id);
      } else {
        await this.repository.manager.query(
          'UPDATE `dot` SET isActive = 1 WHERE id = ?',
          [id],
        );
      }
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
    const items = [
      //! 최애 ✅
      new Dot({
        slug: 'love',
        question:
          '내가 가장 존경하는 인물이나 멘토가 있다면 누구인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 유튜브 채널이나 팟캐스트는 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '여름? or 겨울? 내가 선호하는 계절은 무엇이고 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '가장 가보고 싶은 여행지는 어디 있가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '집·학교·직장을 제외하고 내가 가장 즐겨찾는 장소가 있다면, 어디인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 게임이나 앱이 있다면 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 스포츠 혹은 스포츠 팀은 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '가장 재미있게본 TV 프로그램이나 드라마, 시리즈물에는 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 영화 장르는 무엇인가요? 해당 장르의 최애 영화와 좋아하는 이유는?.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 가치관 ✅
      new Dot({
        slug: 'wow',
        question: '이 세상에서 가장 부러운 사람은 누구입니까? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '감정적으로 분노했던 사건이나 뉴스 중, 가장 먼저 떠오르는 일은 무엇인가요? 그 이유와 나의 입장은?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '다른 사람의 행동 중에서 당신을 가장 화나게 하는 것은 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '힘든 상황에 처했을떄 혼자 극복하려는 편인가요? 아니면 누군가의 도움을 청하는 편인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '룸메이트와 함께 산다고 가정한다면 상대의 어떤 생활습관이나 행동을 보일때 당신을 가장 거슬리게 할까요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '살면서 가장 감사히 여기는 일에는 어떤 것이 있나요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question: '이 세상에서 가장 부러운 사람은 누구입니까? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '내 인생의 황금기는 언제였을까요? 그 이유는? 만일 도래하지 않았다고 믿는다면, 언제가 될 것 같고 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '가장 관심이 있는 사회적 문제나 사회적 책임에 대한 주제는 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '꼭 해보고 싶지만, 아직 못해본 일 중 가장 아쉬운 건 무엇인가요? 그걸 위해 어떤 노력을 하고 있나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '부(돈)에 대한 나의 포부나 경제적 가치관에 대하여 이야기 해주세요.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '사람의 인성은 타고 나는 것이라 생각하나요? 아니면 교화될 수 있는 것일까요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '위로 받을 수 있는 선한 친구와 선의의 경쟁을 할 수 있는 진취적인 친구 중 어떤 친구를 선호하나요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '직장이나 근무지를 고를 때 경제적 보상과 워라벨 중, 보다 중요시 여기는 가치는 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '오랜 기간 함께 했지만 사랑이 남아있지 않을 것 같다면, 헤어지겠습니까? 아니면 화해를 이끌어보겠습니까?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question: '내가 가장 좋아하는 빌런 캐릭터는 누구이고, 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 경험담 ✅
      new Dot({
        slug: 'cool',
        question:
          '내가 받은 선물중 가장 감동적이고 특별한 선물에는 어떤 것이 있나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '타인으로부터 받은 가장 감동적인 도움은 무엇이었나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '그동안 받았던 조언 중 최악의 조언은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '내가 베풀었던 최고로 감동적인 친절이나 최고의 선행을 꼽자면 어떤 일이고, 언제 있었던 일인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '가까운 지인으로부터 상처를 크게 받은 갈등 상황은 무엇이며, 그 일로 어떠한 교훈을 얻었나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '과거 여행지 중에서, 누구에게나 추천하고 싶은 감동의 여행지는 어디인가요? 추천의 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '가장 많이 울었던 영화는 무엇인가요? 어떤 장면이 그렇게 감동적이였나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '당신의 유년 시절은 다른 사람보다 행복했다고 생각하나요? 아니면 반대인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '당신이 직접 겪었던 일 중에 지금 생각해도 오싹한 초자연현상이나 유사한 사건이 있었다면, 어떤 경험인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '투자 등으로 경제적인 손해를 본 경험이 있었나요? 그로인한 내 생활의 변화나 교훈은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '실수를 반복하지 않기위해 스스로 정한 규칙이나 자기관리 방법이 있나요? 그 계기는 무엇이며 효과가 있나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '나의 과거 실수나 오류를 통해 얻은 인생의 교훈이 있다면 무엇인가요? 그것이 나의 인생을 어떻게 변화시켰나요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '심경의 변화로 과거에 옳다고 믿던 일이 현재 정반대로 여겨지는 경험이 있나요? 그 변화의 계기는 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '내 인생에서 최대 트라우마라고 여겨질 만큼 안 좋은 경험이 있다면 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '화가 나거나 스트레스를 받을때, 진정시킬 수 있는 나만의 방법이 있다면? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '내가 우울함을 느낄때, 우울함 극복에 도움이 되는 가장 효과적인 힐링 방법이 있다면? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '당신이 인생에서 가장 자랑하고 싶은 성취 경험은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '나의 안좋은 습관 중에서 꾸준한 노력으로 고치거나 극복한 부분이 있다면 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '스스로 결심한 목표를 달성한 경험에 대하여 이야기해줄 수 있나요? 그 경험에서 얻은 교훈은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '하지 않겠다고 결심했지만, 번번이 실패하는 일이나 버릇이 있나요? 그 이유는 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '지금은 담담하게 말할 수 있는 흑역사 하나만 말한다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 최근 ✅
      new Dot({
        slug: 'saint',
        question:
          '최근에 쇼핑한 물건 중에 내 생활에 가장 큰 변화를 가져오거나 가장 만족하는 제품은 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 쇼핑한 물건 중에 가장 후회하는 것은 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 친분을 쌓은 사람이 있다면 누구이며, 그 사람을 알게 된 계기는 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 나의 건강을 위해 새롭게 시작했거나 관심을 갖게 된 분야가 있다면 무엇인가요? 그 계기는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '최근에 관심을 갖게 된 취미활동은 무엇인가요? 그 계기는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 관심갖기 시작한 재태크 혹은 경제활동이 있다면 무엇인가요? 그 계기는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 가장 많이 마신 음료는 무엇인가요? 그 것을 선택한 이유와 계기는 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 배우기 시작한 자기 계발이나 교육 프로그램이 있다면 무엇인가요? 그 계기는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 봤던 영화나 드라마 중에서 가장 기억에 남는 것은 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 새로운 인사이트를 얻거나 감동을 받은 유튜브 영상을 공유해주세요. 내용 중 어떤 점이 좋았는지도.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: false,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 발견했거나 읽었던 책 중에서 가장 유익한 책이 있다면 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '최근에 경험한 일 들 중에, 예전의 나라면 상상도 못할 일을 경험한 것이 있다면 무엇인가요? 그 계기는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 일상에서 필요한 3가지 ✅
      new Dot({
        slug: 'yes',
        question:
          '이 세상에서 가장 중요하다고 여기는 3가지 아이템은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '내 방에서 없어서는 안 될 가장 소중한 3가지 아이템은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '내 폰에서 없어서는 안 될 가장 중요한 3가지 앱은 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '지금은 갖고있지 않지만, 수년 뒤 나는 이 3가지 아이템을 반드시 갖고 있을 것이다. 이건 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '내가 하면 충분히 잘할 수 있을 법한 비즈니스의 종류를 3가지 물어본다면, 무엇인가요?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '나의 이상형과 가장 비슷하거나 닮은꼴인 3명의 연애인 이름을 말해주세요.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '언제 떠올리더라도 행복한 장소 3군데를 물어본다면 어디인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '누구와 함께 하더라도 자신있게 즐길 수 있는 운동종목 3가지와 좋아하는 이유를 알려주세요.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '누구와 함께 하더라도 재미있게 즐길 수 있는 취미활동 3가지와 좋아하는 이유를 알려주세요.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '연애 상대를 선택함에 있어서, 그 사람이 반드시 갖춰야 하는 3가지 조건이 있다면?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 가정 ✅
      new Dot({
        slug: 'pirate',
        question:
          '시간을 돌릴 수 있다면, 내가 결정했던 것들 중 가장 바꾸고 싶은 건 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '내가 앞으로 일주일 동안만 살 수 있는 운명이라면 죽기 전에 꼭 경험해 보고 싶은 일은 무엇인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '만일 전생에 내가 동물이었다면, 어떤 동물이었을 것이라 생각하나요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '만일 타임머신이 만들어진다면 제일 먼저 가보고 싶은 시대는 언제인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '만일 당신이 슈퍼히어로가 될 수 있다면, 어떤 슈퍼파워를 갖고 싶은가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '만일 당신의 삶이 영화로 만들어 진다면, 그 영화의 장르는 어떤 장르일까요? 그 이유는?',
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
        question:
          '유명해지고 싶다면 어떤 분야에서 유명해 지고 싶나요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '만약 하루 동안만 성별이 바뀌는 기회가 주어진다면, 어떤 일을 경험해보고 싶나요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '당신의 미래에 대해 단 한가지를 물어볼 수 있는 마법의 구슬이 있다면, 어떤 질문을 하고 싶나요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '평생을 다른 나라에서 살아야 한다면 어느 곳을 선택할 것인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),

      //! 논란 ✅
      new Dot({
        slug: 'devil',
        question:
          '결혼제도는 진보한 현대사회에 더 이상 유효하지 않는 제도로 보는 시각이 있습니다. 나의 찬반의견과 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '당신이 꾼 꿈 중에 아직도 잊혀지지않는 가장 이상한 꿈 내용은 무엇인지 말해주세요.',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '대마초를 합법화 하는 나라가 늘어나고 있습니다. 이에 대하여 나의 찬반 의견과 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '가장 과대평가된 유명인이 있다면 누굴 꼽을 수 있을까요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '두 명의 상대를 동시에 사랑하는 것이 가능할까요? 나의 의견과 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '애인과 친구가 바람을 피웠다면 누구를 택할 것인가요? 그 이유는?',
        questionType: QuestionType.SHORT_ANSWER,
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question: '동성애에 대한 나의 찬반 의견과 그 이유를 말해주세요.',
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
      // '내가 해본 가장 도발적이고 발칙한 상상은 무엇인가요?',
    ];

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
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
