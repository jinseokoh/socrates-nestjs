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
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateGameResultDto } from 'src/domain/game-results/dto/create-game-result.dto';
import { UpdateGameResultDto } from 'src/domain/game-results/dto/update-game-result.dto';
import { GameResult } from 'src/domain/game-results/game-result.entity';
import { GameResultsService } from 'src/domain/game-results/game-results.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('games')
export class GameResultsController {
  constructor(private readonly GameResultsService: GameResultsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Game room 스코어 / Q and A 생성' })
  @Post(':gameId')
  async create(
    @Param('gameId') gameId: number,
    @Body() dto: CreateGameResultDto,
  ): Promise<GameResult> {
    console.log(gameId, dto);
    return await this.GameResultsService.create({ ...dto, gameId });
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '모든 GameResult 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getGameResults(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<GameResult>> {
    console.log(query);
    return await this.GameResultsService.findAll(query);
  }

  @ApiOperation({ description: 'GameResult 상세보기' })
  @Get(':id')
  async getGameResultById(@Param('id') id: number): Promise<GameResult> {
    return this.GameResultsService.findById(id, ['user', 'other']);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'GameResult 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateGameResultDto,
  ): Promise<GameResult> {
    return await this.GameResultsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'GameResult soft 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<GameResult> {
    return await this.GameResultsService.softRemove(id);
  }
}
