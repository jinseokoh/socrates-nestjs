import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateGameDto } from 'src/domain/games/dto/create-game.dto';
import { UpdateGameDto } from 'src/domain/games/dto/update-game.dto';
import { Game } from 'src/domain/games/game.entity';
import { GamesService } from 'src/domain/games/games.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Game 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateGameDto,
  ): Promise<Game> {
    console.log({ ...dto, userId });
    return await this.gamesService.create({ ...dto, userId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '모든 Game 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getGames(@Paginate() query: PaginateQuery): Promise<Paginated<Game>> {
    console.log(query);
    return await this.gamesService.findAll(query);
  }

  @ApiOperation({ description: 'Game 상세보기' })
  @Get(':id')
  async getGameById(@Param('id') id: number): Promise<Game> {
    return this.gamesService.findById(id, ['host', 'guest', 'gameResults']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Game 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateGameDto,
  ): Promise<Game> {
    return await this.gamesService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Game soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<Game> {
    return await this.gamesService.softRemove(id);
  }
}
