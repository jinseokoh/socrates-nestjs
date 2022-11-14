import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { REDIS_PUBSUB_CLIENT } from 'src/common/constants';
import { Status } from 'src/common/enums';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Game } from 'src/domain/bids/bid.entity';
import { CreateGameDto } from 'src/domain/bids/dto/create-bid.dto';
import { UpdateGameDto } from 'src/domain/bids/dto/update-bid.dto';
import { User } from 'src/domain/users/user.entity';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Repository } from 'typeorm';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    private readonly fcmService: FcmService,
    @Inject(REDIS_PUBSUB_CLIENT)
    private readonly redisClient: ClientProxy,
    @InjectRepository(Game)
    private readonly repository: Repository<Game>,
    @InjectRepository(Auction)
    private readonly auctionsRepository: Repository<Auction>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateGameDto): Promise<Game> {
    this.logger.log(dto);
    const user = await this.usersRepository.findOneOrFail({
      where: { id: dto.userId },
    });

    // perform basic validation checks
    if (user.isBanned) {
      throw new BadRequestException(`not allowed to bid`);
    }
    const bid = this.repository.create(dto);
    const auction = await this.auctionsRepository.findOne({
      id: dto.auctionId,
    });
    if (auction.status !== Status.ONGOING) {
      throw new BadRequestException(`invalid status`);
    }
    if (auction.lastGameAmount >= dto.amount) {
      throw new BadRequestException(`invalid bid amount`);
    }

    // record this bid for good
    const result = await this.repository.save(bid);
    return result;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<Game>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {
        auctionId: [FilterOperator.EQ, FilterOperator.IN],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
      relations: ['auction'],
    });
  }

  async findById(id: number, relations: string[] = []): Promise<Game> {
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

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  async update(id: number, dto: UpdateGameDto): Promise<Game> {
    const bid = await this.repository.preload({ id, ...dto });
    if (!bid) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(bid);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Game> {
    const bid = await this.findById(id);
    return await this.repository.softRemove(bid);
  }

  async remove(id: number): Promise<Game> {
    const bid = await this.findById(id);
    return await this.repository.remove(bid);
  }
}
