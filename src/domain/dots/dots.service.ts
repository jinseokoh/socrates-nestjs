import { ApiOperation } from '@nestjs/swagger';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { LoremIpsum } from 'lorem-ipsum';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Connection } from 'src/domain/users/entities/connection.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateConnectionDto } from 'src/domain/dots/dto/create-connection.dto';
import { dot } from 'node:test/reporters';

@Injectable()
export class DotsService {
  private readonly logger = new Logger(DotsService.name);

  constructor(
    @InjectRepository(Dot)
    private readonly repository: Repository<Dot>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    private dataSource: DataSource, // for transaction
  ) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'create connection! not dot.' })
  async create(dto: CreateConnectionDto): Promise<void> {
    try {
      await this.connectionRepository.upsert(
        [
          {
            userId: dto.userId,
            dotId: dto.dotId,
            body: dto.body,
          },
        ],
        ['userId', 'dotId'],
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  // Dot 리스트
  async getAll(): Promise<Array<Dot>> {
    return await this.repository.find({
      where: {
        isActive: true,
      },
    });
  }

  // Connection 리스트 w/ Pagination
  // filtering example)
  // - /v1/dots/connections?filter.user.gender=male
  // - /v1/dots/connections?filter.user.dob=$btw:1990-01-01,2010-01-01
  async findAll(query: PaginateQuery): Promise<Paginated<Connection>> {
    const queryBuilder = this.connectionRepository
      .createQueryBuilder('connection')
      .leftJoinAndSelect('connection.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('connection.dot', 'dot');

    const config: PaginateConfig<Connection> = {
      relations: {
        user: { profile: true },
        // dot: true, // not being used at least for now.
      },
      sortableColumns: ['id'],
      searchableColumns: ['body'],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        dotId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
        'user.dob': [FilterOperator.GTE, FilterOperator.LT, FilterOperator.BTW],
        'user.gender': [FilterOperator.EQ],
        // 'dot.slug': [FilterOperator.EQ, FilterOperator.IN],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  // Meetup 상세보기
  async findById(id: number, relations: string[] = []): Promise<Connection> {
    try {
      return relations.length > 0
        ? await this.connectionRepository.findOneOrFail({
            where: { id },
            relations,
          })
        : await this.connectionRepository.findOneOrFail({
            where: { id },
          });
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  async seedDots(): Promise<void> {
    const items = [
      new Dot({
        slug: 'angry',
        question:
          '친구나 지인으로부터 상처를 크게 받은 갈등 상황이 있었다면, 어떤 것이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '화가 나거나 스트레스를 받을때, 나를 진정시킬 수 있는 치유 방법이 있다면 어떤 것이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '내가 감정적으로 분노했던 사건이나 뉴스 중, 가장 먼저 떠오르는 일은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question: '약속을 어긴 사람에 대한 실망감을 어떻게 표현하시겠어요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '당시에는 화를 냈었지만, 지나고 보니 오히려 내가 미안했던 적이 있다면, 어떤 일이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '직장에서 누군가가 당신을 자주 불편하게 만든다면, 그 상황을 어떻게 해결하고 극복하시겠어요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '화가 났지만, 내 감정을 억누른채 솔직하게 표현하지 못한 적이 자주 있는 편인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '나를 불편하게 만드는 스트레스 상황 속에서 도움을 받고자 한다면 누구에게 도움을 청할 것 같나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '토론이나 논쟁 중에 어떤 이의 언어 도발이 나를 불편하게 만들었습니다. 어떻게 대응하시겠어요?',
        isActive: true,
      }),
      new Dot({
        slug: 'angry',
        question:
          '룸메이트와 함께 산다고 가정한다면 상대의 어떤 생활습관이나 특징이 당신을 가장 거슬리게 할까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '내가 일주일 동안만 살 수 있는 운명이라면 죽기 전에 꼭 경험해 보고 싶은 일은?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 전생에 내가 동물이었다면, 어떤 동물이었을 것이라 생각하나요? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '지구 멸망 전 한명의 지구인과 우주선을 타고 탈출 할 수 있습니다. 누구와 동행하겠나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 타임머신이 만들어진다면 제일 먼저 가보고 싶은 시대는 언제인가요? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 당신이 슈퍼히어로가 될 수 있다면, 어떤 슈퍼파워를 갖고 싶은가요? 그 능력을 원하는 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 당신의 삶이 영화로 만들어 진다면, 그 영화의 장르는 어떤 장르일까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '이 세상 누구라도 초대할 수 있는 저녁 식사 기회가 주어진다면 누구를 초대하겠어요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '당신의 미래에 대해 단 한가지를 물어볼 수 있는 마법의 구슬이 있다면, 어떤 질문을 할 건가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '평생 한가지 종류의 음식만 먹어야하는 저주에 걸렸다면 어떤 메뉴를 고를까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만약 하루 동안만 성별이 바뀌는 기회가 주어진다면, 어떤 일을 경험해보고 싶나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 존경하는 인물이나 멘토가 있다면 누구인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 유튜브 채널이나 팟캐스트는 어떤 것들인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 감사하게 생각하는 일은 어떤 것인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 즐겨찾는 음식점이나 맛집을 꼽는다면 어디인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 즐겨먹는 점심메뉴는 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 좋아하는 패션 브랜드는 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 좋아하는 스포츠 경기와 팀은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 재미있게 본 TV프로그램이나 시리즈는 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 좋아하는 게임이나 앱이 있다면 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 선호하는 영화 장르는 어떤 것인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 나의 건강을 위해 새롭게 시작했거나 관심을 갖게 된 변화가 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 배우기 시작한 자기 계발이나 교육 프로그램이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 발견한 좋아하는 책, 영화, 혹은 드라마가 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 발견한 맛집, 베이커리, 혹은 카페가 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 새로 시작하거나 관심갖기 시작한 재태크 혹은 경제활동이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 좋아하게된 음식, 요리, 혹은 음료가 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 관심을 갖게 되거나 새로 시작한 취미가 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 새로운 사람들과 친분을 쌓거나 소속감을 느낀 적이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 쇼핑한 물건 중에 가장 마음에 드는 것은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 쇼핑한 물건 중에 가장 후회하는 것은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '지금까지의 삶에서 가장 힘들거나 어려웠던 순간을 공유해 줄 수 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '시간을 돌릴 수 있다면, 내가 결정했던 것들 중 가장 바꾸고 싶은 건 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '내가 노력했건만 실패를 경험한 적이 있나요? 그 상황에서 어떻게 대처했습니까?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '나의 과거 실수나 오류 통해 배운 가장 큰 인생의 교훈은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '전에는 옳다고 생각했던 일이 지금 생각해보면 잘못된 거라 믿는, 혹은 그 반대의 경우가 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '내 인생에서 트라우마라고 여겨질 만큼 안 좋은 경험이나 기억이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '과거의 갈등으로 연락을 안하고 지내던 사람이, 몇 년 만에 연락을 해온다면 나의 반응은?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '하지 않겠다고 결심했지만, 번번이 실패하는 일이나 버릇이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '스스로 잘못했다고 생각하는 일에 대해 어떻게 자신을 용서하고 헤쳐 나갔나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'no',
        question:
          '투자 등으로 경제적인 손해를 본 경험이 있었다면 그 상황을 어떻게 극복했나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '당신이 인생에서 가장 자랑하고 싶은 성취 경험은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '나의 안좋은 습관 중에서 꾸준한 노력으로 고치거나 극복한 부분이 있다면 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '성공적으로 이뤄낸 과제나 프로젝트가 있나요? 그 경험이 당신에게 어떤 영향을 미쳤나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '자신이 설정한 목표를 달성하고 그 경험에서 얻은 교훈은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '당신의 노력으로 인해 다른 사람에게 영향을 미쳤거나 도움을 주었던 적이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '최근에 가장 감동받거나 감사했던 순간은 어떤 것이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '자신이 개발하거나 창작한 것 중에서 특히 자랑스러운 작품이나 결과물은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '살면서 경험한 기이한 경험들 중 제일 신기하고 기이한 일을 말해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question:
          '내가 받은 선물중 가장 감동적이고 특별한 선물에는 어떤 것이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'cool',
        question: '타인으로부터 받은 가장 감동적인 도움은 무엇이었나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question: '가족이나 친구와의 갈등 상황이 있었을때 어떻게 화해 했나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '과거의 아픈 기억을 통해 얻게 된 교훈이나 동기부여가 있다면 이야기 해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '현재 우울감이나 슬픔을 느끼고 있다면, 그 이유에 대해 이야기 해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '혼자 펑펑 울었던 때가 있었다면, 언제였고, 무슨일이 있었는지 이야기 해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '슬픔을 극복하고 다시 일어나기 위해 했던 노력들 중 가장 기억에 남는 일은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question: '가족 중 누구의 죽음에 가장 슬퍼할 것 같은가요? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '내가 우울함을 느낄때, 우울함 극복에 도움이 되는 나만의 힐링 방법이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '과거의 어떤 일에 대한 기억이 여전히 가슴 아프게 남아있다면, 어떤 것이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '누군가에게 실망했었지만, 용서하고 다시 관계개선을 했던 기억이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'sad',
        question:
          '성장과정에서 힘들었던 부분 중 하나를 꼽는다면 어떤 일이 있을까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question: '당신의 유년 시절은 다른 사람보다 행복했나요? 불행했나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '내 인생의 황금기는 이미 지나갔나요? 아직 지나지 않았다면 언제쯤 도래할까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '의견이 대립될 때 설득을 잘 하는 편인가요? 아니면 설득을 잘 당하는 편인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question: '어떤 사회적 문제나 사회적 책임에 대한 관심이 있나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '돈과 재정적인 안정에 대한 나의 포부나 가치관은 어떻게 되나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question: '아이폰? or 안드로이드폰? 선택한 이유는 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question: '여름? or 겨울? 내가 선호하는 계절은 무엇이고 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '결혼 제도나 결혼 문화에서 개선되어야 하는 점은 무엇이라 생각하나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '위로 받을 수 있는 친구와 선의의 경쟁을 할 수 있는 친구 중 어떤 부류를 선호하나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wow',
        question:
          '직장이나 근무지를 고를 때 경제적 보상과 워라벨 중, 보다 중요시 여기는 가치는?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question: '내가 가장 좋아하는 빌런 캐릭터는 누구이고, 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question: '지금은 담담하게 말할 수 있는 흑역사 하나만 말한다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question: '인간관계에서 가장 중요한 것은 무엇이라고 생각하나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '꼭 해보고 싶다고 염원해 왔지만 못해본 일 중 가장 아쉬운 건 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question: '유명해지고 싶다면 어떤 분야에서 유명해 지고 싶나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '애인과 친구가 바람을 피웠다면 누구를 택할 것인가요? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '비트코인, 주식, US달러, 미술작품 중 안전자산을 선택한다면? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '로봇과 AI 가 극도로 발전한 사회에서도 꾸준히 각광받을 직업군은 어떤 것이 있을까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '이것 하나만 충족된다면 나는 완벽할 것 같다. 이것은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '내가 이것을 소유하면 나의 성공의 상징이 될 것이다. 어것은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question:
          '이 세상에서 가장 중요하다고 여기는 3가지 아이템에는 무엇이 있니요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question:
          '내 방에서 없어서는 안 될 가장 소중한 3가지 아이템은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question: '내 폰에서 없어서는 안 될 가장 중요한 3가지 앱은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question:
          '현재는 갖고 있지 않지만, 언젠가는 꼭 마련하고 싶은 3가지 아이템은 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question:
          '내가 하면 잘할 것 같은 비즈니스 종류를 3가지 물어본다면 무엇인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question: '다른 사람한테는 없는 나의 장점 3가지를 말해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question:
          '언제 떠올리더라도 행복한 장소 3군데를 물어본다면 어디인가요?',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question: '내가 누구나 함께 즐길 수 있는 운동종목 3가지를 알려주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question: '여가시간에 함께 즐기고 싶은 취미활동 3가지를 알려주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'wink',
        question:
          '바이러스로 인해 사람들간 접촉이 불가능해지는 시대가 온다면, 가장 잘 팔릴 아이템 5가지는?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '부모 세대에서는 원수 집안으로 여겨졌더라도 자식세대에서는 서로 친하게 지낼 수 있다고 생각하나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '대한민국에서는 범죄인이 비록 사형을 선고받더라도, 형을 집행하고 있지 않습니다. 이에 동의하시나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '동성간의 결혼을 찬성 혹은 반대한다면 그 답변과 이유를 말해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '대마초와 마약에 대하여, 지금 보다 더욱 강력한 법적 제재가 필요하다고 보시나요?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question: '과학 연구를 위한 동물 실험에 대하여 찬성하나요? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '로맨틱한 영화나 소설 속 장면 중 잊지 못할 매력적인 장면을 소개해 주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '전세계적인 빈부격차가 증가하는 이유와 그것에 대한 대응책은 무엇이 있을지 말해주세요.',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question:
          '인공지능 기술이 지속적으로 발전한다면, 인류는 유토피아를 맞이하게 될까요? 아니면 그 반대가 될까요?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question: '지상외모주의에 대한 나의 견해는?',
        isActive: true,
      }),
      new Dot({
        slug: 'devil',
        question: '결혼은 선택사항인가요? 아니면 필수사항인가요? 그 이유는?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 차를 마셔야 하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 점심을 먹어야 하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 운동을 해야하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 여행 계획을 세워야 하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 영화나 드라마를 봐야하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 요리를 해야하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 스포츠 경기를 감상해야하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 쇼핑을 해야하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question: '나와 함께 하이킹이나 산책을 즐겨야 하는 이유를 묻는다면?',
        isActive: true,
      }),
      new Dot({
        slug: 'saint',
        question:
          '나와 함께 책을 읽고 문학적인 이해를 공유해야하는 이유를 묻는다면?',
        isActive: true,
      }),
      // new Dot({
      //   slug: 'devil',
      //   question: '당신의 로맨틱한 꿈이나 판타지 속 이상형은 어떤 모습인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 분위기에서 빠지면 안되는 가장 중요한 요소가 있다면, 무엇인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 상황에서 상대방과 함께 나누고 싶은 음료나 음식이 있다면, 무엇인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 여행을 단둘이 떠날 수 있는 기회가 있다면, 가장 이상적인 여행지와 숙소는 어디인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '1시간 안에 갈 수 있는 가장 비밀스럽고 로맨틱한 장소를 떠올린다면 그 장소는 어디인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 영화나 소설 속 장면 중 잊지 못할 매력적인 장면을 소개해 주세요.',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '이성에게 매력적으로 보이기 위해 사용하는 나만의 비법은 무엇인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '낯선 상대방으로부터 성적 매력을 느낄 때가 있었다면, 어떤 상황이었나요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '당신을 섹시한 무드로 만드는 특별한 상황이나 분위기가 있다면, 무엇인가요?',
      //   isActive: true,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question: '내가 해본 가장 도발적이고 발칙한 상상은 무엇인가요?',
      //   isActive: true,
      // }),
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

  async seedConnections(): Promise<void> {
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

    Promise.all(
      [...Array(240).keys()].map(async (v: number) => {
        const dotId = (v % 120) + 1;
        const userId = randomInt(1, 20);
        const body = lorem.generateSentences(5);
        const dto = new CreateConnectionDto();
        dto.dotId = dotId;
        dto.userId = userId;
        dto.body = body;
        await this.create(dto);
      }),
    );
  }
}
