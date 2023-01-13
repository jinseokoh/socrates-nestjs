import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CreateGameResultDto } from 'src/domain/game-results/dto/create-game-result.dto';
import { UpdateGameResultDto } from 'src/domain/game-results/dto/update-game-result.dto';
import { GameResult } from 'src/domain/game-results/game-result.entity';
import { Game } from 'src/domain/games/game.entity';
import { User } from 'src/domain/users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GameResultsService {
  private readonly logger = new Logger(GameResultsService.name);

  constructor(
    @InjectRepository(GameResult)
    private readonly repository: Repository<GameResult>,
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateGameResultDto): Promise<GameResult> {
    const game = await this.gamesRepository.findOneOrFail({
      where: { id: dto.gameId },
    });
    if (!game.guestId) {
      throw new BadRequestException(`the game room is not ready.`);
    }

    return await this.repository.save(
      this.repository.create({
        ...dto,
        hostId: game.hostId,
        guestId: game.guestId,
      }),
    );
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  async findAll(query: PaginateQuery): Promise<Paginated<GameResult>> {
    return paginate(query, this.repository, {
      sortableColumns: ['id'],
      searchableColumns: [],
      defaultSortBy: [['id', 'DESC']],
      filterableColumns: {},
      relations: ['game'],
    });
  }

  async findById(id: number, relations: string[] = []): Promise<GameResult> {
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

  async update(id: number, dto: UpdateGameResultDto): Promise<GameResult> {
    const GameResult = await this.repository.preload({ id, ...dto });
    if (!GameResult) {
      throw new NotFoundException(`entity not found`);
    }
    return await this.repository.save(GameResult);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  async softRemove(id: number): Promise<GameResult> {
    const GameResult = await this.findById(id);
    return await this.repository.softRemove(GameResult);
  }

  async remove(id: number): Promise<GameResult> {
    const GameResult = await this.findById(id);
    return await this.repository.remove(GameResult);
  }
}
