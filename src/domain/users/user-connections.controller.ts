import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Connection } from 'src/domain/dots/entities/connection.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateReactionDto } from 'src/domain/users/dto/create-reaction.dto';
import { RemoveReactionDto } from 'src/domain/users/dto/remove-reaction.dto';
import { Reaction } from 'src/domain/dots/entities/reaction.entity';
import { UsersConnectionService } from 'src/domain/users/users-connection.service';
import { UpsertReactionDto } from 'src/domain/users/dto/upsert-reaction.dto';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserConnectionsController {
  constructor(
    private readonly usersConnectionService: UsersConnectionService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 발견 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 만든 발견 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/connections')
  async getMyConnections(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    return await this.usersConnectionService.getMyConnections(userId, query);
  }

  //?-------------------------------------------------------------------------//
  //? ReportConnection Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '차단한 발견 리스트에 추가' })
  @Post(':userId/connections-reported/:connectionId')
  async attachToConnectionReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body('message') message: string,
  ): Promise<any> {
    //? checking if this connection belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersConnectionService.attachToReportConnectionPivot(
        userId,
        connectionId,
        message,
      );

      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '차단한 발견 리스트에서 삭제' })
  @Delete(':userId/connections-reported/:connectionId')
  async detachFromConnectionReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
  ): Promise<any> {
    //? checking if this connection belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersConnectionService.detachFromReportConnectionPivot(
        userId,
        connectionId,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 차단한 발견 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/connections-reported')
  async getConnectionsReportedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    const { data, meta, links } =
      await this.usersConnectionService.getConnectionsReportedByMe(
        userId,
        query,
      );

    return {
      data: data.map((v) => v.connection),
      meta: meta,
      links: links,
    } as Paginated<Connection>;
  }

  @ApiOperation({ description: '내가 차단한 발견ID 리스트 (all)' })
  @PaginateQueryOptions()
  @Get(':userId/connectionids-reported')
  async getConnectionIdsReportedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    const data = await this.usersConnectionService.getConnectionIdsReportedByMe(
      userId,
    );
    return {
      data,
    };
  }

  //?-------------------------------------------------------------------------//
  //? Reaction Pivot
  //?-------------------------------------------------------------------------//

  //? this one has more than 1 responsibility
  //? - we send notification to the poster if if isNewReaction is true (todo. need to improve the logic)
  //? - update reaction entity itself (do we need to delete it if all 5 emotions are falsy?)
  //? - update connection's reaction counts

  @ApiOperation({ description: '발견 reaction 리스트에 추가' })
  @Post(':userId/connections/:connectionId')
  async upsertReaction(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: UpsertReactionDto,
  ): Promise<Connection> {
    return await this.usersConnectionService.upsertReaction({
      ...dto,
      userId: userId,
      connectionId: connectionId,
    });
  }

  //! @deprecated
  @ApiOperation({ description: '발견 reaction 리스트에 추가' })
  @Put(':userId/connections/:connectionId')
  async attachToReactionPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: CreateReactionDto, // optional message, and skill
  ): Promise<Reaction> {
    return await this.usersConnectionService.attachToReactionPivot(
      userId,
      connectionId,
      dto.emotion,
    );
  }

  //! @deprecated
  @ApiOperation({ description: '발견 reaction 리스트에서 삭제' })
  @Delete(':userId/connections/:connectionId')
  async detachToReactionPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: RemoveReactionDto, // optional message, and skill
  ): Promise<Reaction> {
    return await this.usersConnectionService.detachFromReactionPivot(
      userId,
      connectionId,
      dto.emotion,
    );
  }

  //? 특정 발견글에 대한 나의 reaction 조회
  @ApiOperation({ description: '발견 reaction 조회' })
  @PaginateQueryOptions()
  @Get(':userId/connections/:connectionId')
  async getReaction(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
  ): Promise<Reaction> {
    return await this.usersConnectionService.getReaction(userId, connectionId);
  }

  //? list of 발견글들에 대한 나의 리액션들 (use case 는? 딱히 안 떠오르는데? almost deprecated)
  @ApiOperation({ description: '발견 reaction 리스트 (all)' })
  @Get(':userId/reactions')
  async getReactions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
    ids: number[],
  ): Promise<Array<Reaction>> {
    return await this.usersConnectionService.getReactions(userId, ids);
  }

  @ApiOperation({ description: '내가 반응한 발견 리스트 (paginated)' })
  @PaginateQueryOptions()
  @Get(':userId/connections-reacted')
  async getConnectionsReactedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    const { data, meta, links } =
      await this.usersConnectionService.getConnectionsReactedByMe(
        userId,
        query,
      );

    return {
      data: data.map((v) => v.connection),
      meta: meta,
      links: links,
    } as Paginated<Connection>;
  }
}
