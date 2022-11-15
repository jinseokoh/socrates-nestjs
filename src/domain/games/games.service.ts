import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { CreateGameDto } from 'src/domain/games/dto/create-game.dto';
import { UpdateGameDto } from 'src/domain/games/dto/update-game.dto';
import { Game } from 'src/domain/games/game.entity';
import { User } from 'src/domain/users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @InjectRepository(Game)
    private readonly repository: Repository<Game>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateGameDto): Promise<Game> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: dto.userId },
    });
    if (user.isBanned) {
      throw new BadRequestException(`not allowed to use`);
    }
    const game = this.repository.create(dto);
    return await this.repository.save(game);
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
        title: [FilterOperator.EQ],
        userId: [FilterOperator.EQ, FilterOperator.IN],
      },
      relations: ['user'],
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
    const game = await this.repository.preload({ id, ...dto });
    if (!game) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(game);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<Game> {
    const game = await this.findById(id);
    return await this.repository.softRemove(game);
  }

  async remove(id: number): Promise<Game> {
    const game = await this.findById(id);
    return await this.repository.remove(game);
  }
}
