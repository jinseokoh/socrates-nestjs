import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DotStatus } from 'src/common/enums';
import { CreateDotDto } from 'src/domain/connections/dto/create-dot.dto';
import { UpdateDotDto } from 'src/domain/connections/dto/update-dot.dto';
import { Dot } from 'src/domain/connections/entities/dot.entity';
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

  // Dot 리스트
  async getAll(): Promise<Array<Dot>> {
    return await this.repository.find({
      relations: ['user'],
      where: {
        isActive: true,
        status: Not(IsNull()),
      },
    });
  }

  // Dot 리스트
  async getBySlug(slug: string): Promise<Array<Dot>> {
    return await this.repository.find({
      where: {
        isActive: true,
        slug: slug,
        status: Not(IsNull()),
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
      //! 최애
      new Dot({
        slug: 'love',
        question:
          '내가 가장 존경하는 인물이나 멘토가 있다면 누구인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 유튜브 채널이나 팟캐스트는 어떤 것인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '살면서 가장 감사하게 여기는 일에는 어떤 것이 있나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '집·학교·직장을 제외하고 내가 가장 즐겨찾는 장소가 있다면, 어디인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 즐겨먹는 점심메뉴는 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question: '내가 가장 좋아하는 패션 브랜드는 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 스포츠 혹은 스포츠 팀은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '가장 기억에 남는 TV 프로그램이나 시리즈는 무엇이 있나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 게임이나 앱이 있다면 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'love',
        question:
          '내가 가장 좋아하는 영화 장르는 무엇인가요? 해당 장르를 좋아하는 이유도 함께 알려주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 갈등
      new Dot({
        slug: 'angry',
        question:
          '가까운 지인으로부터 상처를 크게 받은 갈등 상황에 대해 이야기 해주실 수 있나요? 그 일로 얻은 교훈은?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '최근 감정적으로 분노했던 사건이나 뉴스 중, 가장 먼저 떠오르는 일은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '약속을 어긴 사람에 대한 실망감을 어떤 식으로 표현하는 것이 좋다고 생각하나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '다른 사람의 행동 중에서 당신을 가장 화나게 하는 것은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '과거의 갈등으로 연락두절한 사람이 연락을 해온다면, 만날까요? 아니면 무시할까요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '대다수의 사람과 나의 의견이 다르다면 내 소신을 분명히 밝히는 편인가요? 아니면 표현하지 않고 넘어가는 편인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '힘든 상황을 혼자 극복하려는 편인가요? 아니면 누군가의 도움을 청하는 편인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '화가 났을때 상대방에게 직설적으로 표현하는 편인가요? 아니면 잘 표현하지 않는 편인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '룸메이트와 함께 산다고 가정한다면 상대방의 어떤 생활습관이나 특징이 당신을 가장 거슬리게 할까요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'angry',
        question:
          '화가 나거나 스트레스를 받을때, 진정시킬 수 있는 나만의 비법이 있다면 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 가치
      new Dot({
        slug: 'wow',
        question:
          '당신의 유년 시절은 다른 사람보다 행복했다고 생각하나요? 아니면 반대인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '내 인생의 황금기는 언제라고 생각하나요? 그 이유는? 아직 도래 하지 않았다면 언제가 될 것 같고 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '의견이 대립될 때 설득을 잘 하는 편인가요? 아니면 설득을 잘 당하는 편인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '가장 관심이 있는 사회적 문제나 사회적 책임에 대한 주제는 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '부(돈)에 대한 나의 포부나 가치관은 어떻게 되나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question: '아이폰? or 안드로이드폰? 선택한 이유는 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question: '여름? or 겨울? 내가 선호하는 계절은 무엇이고 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '첫인상이 좋지 않았지만, 나중에 그 사람에 대한 평가가 달라진 경험이 있나요? 있었다면 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '위로 받을 수 있는 선한 친구와 선의의 경쟁을 할 수 있는 똑똑한 친구 중 어떤 부류를 선호하나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wow',
        question:
          '직장이나 근무지를 고를 때 경제적 보상과 워라벨 중, 보다 중요시 여기는 가치와 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 신박
      new Dot({
        slug: 'pirate',
        question: '내가 가장 좋아하는 빌런 캐릭터는 누구이고, 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question: '지금은 담담하게 말할 수 있는 흑역사 하나만 말한다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '인간관계에서 가장 중요한 것은 무엇이라고 생각하나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '꼭 해보고 싶다고 염원해 왔지만 못해본 일 중 가장 아쉬운 건 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '유명해지고 싶다면 어떤 분야에서 유명해 지고 싶나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '귀신이나, 초자연적 현상, 혹은 사후세계가 존재한다고 믿나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '비트코인, 주식, US달러, 귀금속, 예술품 중 안전자산을 선택한다면? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question: '이 세상에서 가장 부러운 사람은 누구입니까? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '가장 많이 울었던 영화는 무엇인가요? 어떤 장면이 감동적이였나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'pirate',
        question:
          '가장 과대평가된 유명인이 있다면 누굴 꼽을 수 있을까요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 슬픔
      new Dot({
        slug: 'sad',
        question: '가족이나 친구와의 갈등 상황이 있었을때 어떻게 화해 했나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '과거의 아픈 기억을 통해 얻게 된 교훈이나 동기부여가 있다면 이야기 해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '현재 우울감이나 슬픔을 느끼고 있다면, 그 이유에 대해 이야기 해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '혼자 펑펑 울었던 때가 있었다면, 언제였고, 무슨일이 있었는지 이야기 해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '슬픔을 극복하고 다시 일어나기 위해 했던 노력들 중 가장 기억에 남는 일은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question: '가족 중 누구의 죽음에 가장 슬퍼할 것 같은가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '내가 우울함을 느낄때, 우울함 극복에 도움이 되는 나만의 힐링 방법이 있나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '과거의 어떤 일에 대한 기억이 여전히 가슴 아프게 남아있다면, 어떤 것이 있나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '누군가에게 실망했었지만, 용서하고 다시 관계개선을 했던 기억이 있나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'sad',
        question:
          '성장과정에서 힘들었던 부분 중 하나를 꼽는다면 어떤 일이 있을까요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 성취
      new Dot({
        slug: 'cool',
        question: '당신이 인생에서 가장 자랑하고 싶은 성취 경험은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question:
          '나의 안좋은 습관 중에서 꾸준한 노력으로 고치거나 극복한 부분이 있다면 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question:
          '내가 다른 사람들을 리드하여 성공적으로 결과를 이뤄낸 과제나 프로젝트가 있다면 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question:
          '스스로 결심한 목표를 달성한 경험에 대하여 이야기해줄 수 있나요? 그 경험에서 얻은 교훈은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question: '일상에서 느낄 수 있는',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question: '최근에 가장 감동받거나 감사했던 순간은 어떤 것이 있나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question:
          '자신이 개발하거나 창작한 것 중에서 특히 자랑스러운 작품이나 결과물은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question:
          '살면서 경험한 기이한 경험들 중 제일 신기하고 기이한 일을 말해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question:
          '내가 받은 선물중 가장 감동적이고 특별한 선물에는 어떤 것이 있나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'cool',
        question: '타인으로부터 받은 가장 감동적인 도움은 무엇이었나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 실수
      new Dot({
        slug: 'no',
        question:
          '지금까지의 삶에서 가장 힘들거나 어려웠던 순간은 언제였나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '시간을 돌릴 수 있다면, 내가 결정했던 것들 중 가장 바꾸고 싶은 건 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '내가 노력했건만 실패를 경험한 적이 있다면 무엇인가요? 그 실패의 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '내 인생에서 트라우마라고 여겨질 만큼 안 좋은 경험이 있다면 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '하지 않겠다고 결심했지만, 번번이 실패하는 일이나 버릇이 있나요? 그 이유는 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '투자 등으로 경제적인 손해를 본 경험이 있었다면 무엇인가요? 그것이 나의 인생을 어떻게 변화시켰나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '나의 과거 실수나 오류를 통해 얻은 인생의 교훈이 있다면 무엇인가요? 그것이 나의 인생을 어떻게 변화시켰나요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '심경의 변화로 과거에 옳다고 믿던 일이 현재 정반대로 여겨지는 경험이 있나요? 그 변화의 계기는 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '실수를 반복하지 않기위해 스스로 정한 규칙이나 자기관리 방법이 있나요? 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'no',
        question:
          '최근에 쇼핑한 물건 중에 가장 후회하는 것은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 최근
      new Dot({
        slug: 'yes',
        question:
          '최근에 친분을 쌓은 사람이 있다면 누구이며, 그 사람을 알게 된 계기는 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 나의 건강을 위해 새롭게 시작했거나 관심을 갖게 된 분야가 있다면 무엇인가요? 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question: '최근에 관심을 갖게 된 취미활동은 무엇인가요? 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 관심갖기 시작한 재태크 혹은 경제활동이 있다면 무엇인가요? 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 좋아진 음식, 요리, 혹은 음료가 있다면 무엇인가요? 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 배우기 시작한 자기 계발이나 교육 프로그램이 있다면 무엇인가요? 그 계기는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 봤던 영화나 드라마 중에서 가장 기억에 남는 것은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 발견했거나 읽었던 유익한 책이 있다면 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 경험한 일 들 중에, 가장 멋진 일에는 어떤 것이 있나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yes',
        question:
          '최근에 쇼핑한 물건 중에 가장 마음에 드는 것은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 일상
      new Dot({
        slug: 'wink',
        question:
          '이 세상에서 가장 중요하다고 여기는 3가지 아이템에는 무엇이 있니요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '내 방에서 없어서는 안 될 가장 소중한 3가지 아이템은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question: '내 폰에서 없어서는 안 될 가장 중요한 3가지 앱은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '현재는 갖고 있지 않지만, 언젠가는 꼭 마련하고 싶은 3가지 아이템은 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '내가 하면 잘할 것 같은 비즈니스 종류를 3가지 물어본다면 무엇인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '내 이상형과 가장 비슷하거나 닮은꼴인 3명의 연애인 이름을 말해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '언제 떠올리더라도 행복한 장소 3군데를 물어본다면 어디인가요?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '누구와 함께 하더라도 자신있게 즐길 수 있는 운동종목 3가지를 알려주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '누구와 함께 하더라도 자신있게 즐길 수 있는 취미활동 3가지를 알려주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'wink',
        question:
          '연애 상대를 선택함에 있어서, 그 사람이 반드시 갖춰야 하는 3가지 조건이 있다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 엉뚱
      new Dot({
        slug: 'yuck',
        question:
          '내가 앞으로 일주일 동안만 살 수 있는 운명이라면 죽기 전에 꼭 경험해 보고 싶은 일은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 전생에 내가 동물이었다면, 어떤 동물이었을 것이라 생각하나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '지구 멸망 전 한명의 지구인과 우주선을 타고 탈출 할 수 있습니다. 누구와 동행하고 싶나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 타임머신이 만들어진다면 제일 먼저 가보고 싶은 시대는 언제인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 당신이 슈퍼히어로가 될 수 있다면, 어떤 슈퍼파워를 갖고 싶은가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만일 당신의 삶이 영화로 만들어 진다면, 그 영화의 장르는 어떤 장르일까요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '만약 하루 동안만 성별이 바뀌는 기회가 주어진다면, 어떤 일을 경험해보고 싶나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '당신의 미래에 대해 단 한가지를 물어볼 수 있는 마법의 구슬이 있다면, 어떤 질문을 하고 싶나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '현존하는 인물들 중 누구라도 초대할 수 있는 저녁 식사 기회가 주어진다면 누구를 초대하고 싶나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'yuck',
        question:
          '지난 역사상 유명 인물들 중 그 누구와도 대화를 나눌 수 있는 기회가 생긴다면, 누구와 대화를 나누고 싶나요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 논란
      new Dot({
        slug: 'devil',
        question:
          '육류 섭취를 안하는 비건에 대하여 유별난 소수라는 시각과, 윤리적인 동물 애호가라는 시각이 있습니다. 나의 의견과 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '두 명의 상대를 동시에 사랑하는 것이 가능할까요? 나의 의견과 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '대마초를 합법화 하는 나라가 늘어나고 있습니다. 이에 대하여 나의 찬반 의견과 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '당신이 꾼 꿈 중에 기억에 남는 가장 이상한 꿈 내용을 말해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '당신이 겪은 일 중에 가장 무서웠던 일은 무엇인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '애인과 친구가 바람을 피웠다면 누구를 택할 것인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '오픈 릴레이션십에 대한 나의 찬반 의견과 그 이유를 말해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question: '동성애에 대한 나의 찬반 의견과 그 이유를 말해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question: '결혼은 선택사항인가요? 아니면 필수사항인가요? 그 이유는?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'devil',
        question:
          '결혼도 비즈니스라는 말에 대하여 나의 찬반 의견과 그 이유를 말해주세요.',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      //! 기타
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 차를 마셔야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 요리를 해야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 점심을 먹어야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 운동을 해야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 여행 계획을 세워야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 영화를 봐야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 스포츠 경기를 관람해야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 쇼핑을 해야하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 산책을 즐겨야 하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      new Dot({
        slug: 'saint',
        question:
          '다른 사람이 아닌, 바로 나와 함께 책을 읽고 문학적인 이해를 공유해야하는 이유를 물어본다면?',
        isActive: true,
        status: DotStatus.FIXED,
      }),
      // new Dot({
      //   slug: 'devil',
      //   question: '당신의 로맨틱한 꿈이나 판타지 속 이상형은 어떤 모습인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 분위기에서 빠지면 안되는 가장 중요한 요소가 있다면, 무엇인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 상황에서 상대방과 함께 나누고 싶은 음료나 음식이 있다면, 무엇인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 여행을 단둘이 떠날 수 있는 기회가 있다면, 가장 이상적인 여행지와 숙소는 어디인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '1시간 안에 갈 수 있는 가장 비밀스럽고 로맨틱한 장소를 떠올린다면 그 장소는 어디인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '로맨틱한 영화나 소설 속 장면 중 잊지 못할 매력적인 장면을 소개해 주세요.',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '이성에게 매력적으로 보이기 위해 사용하는 나만의 비법은 무엇인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '낯선 상대방으로부터 성적 매력을 느낄 때가 있었다면, 어떤 상황이었나요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question:
      //     '당신을 섹시한 무드로 만드는 특별한 상황이나 분위기가 있다면, 무엇인가요?',
      //   isActive: true, status: DotStatus.FIXED,
      // }),
      // new Dot({
      //   slug: 'devil',
      //   question: '내가 해본 가장 도발적이고 발칙한 상상은 무엇인가요?',
      //   isActive: true, status: DotStatus.FIXED,
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
}
