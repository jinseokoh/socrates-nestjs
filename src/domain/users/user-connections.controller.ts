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
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { AnyData } from 'src/common/types';
import { UsersService } from 'src/domain/users/users.service';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateReactionDto } from 'src/domain/users/dto/create-reaction.dto';
import { RemoveReactionDto } from 'src/domain/users/dto/remove-reaction.dto';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';
import { GetReactionsDto } from 'src/domain/users/dto/get-reactions.dto';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserConnectionsController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? 내가 만든 발견 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '내가 만든 발견 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/connections')
  async getMyConnections(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    return await this.usersService.getMyConnections(userId, query);
  }

  //?-------------------------------------------------------------------------//
  //? Like Pivot
  //?-------------------------------------------------------------------------//

  // @ApiOperation({ description: '나의 찜 리스트에 추가' })
  // @Post(':userId/connections-liked/:connectionId')
  // async attachToLikePivot(
  //   @Param('userId', ParseIntPipe) userId: number,
  //   @Param('connectionId', ParseIntPipe) connectionId: number,
  // ): Promise<any> {
  //   //? checking if this connection belongs to the user costs a database access,
  //   //? which you can get around if you design your application carefully.
  //   //? so user validation has been removed. keep that in mind.

  //   console.log(userId, connectionId);
  //   try {
  //     await this.usersService.attachToLikePivot(userId, connectionId);
  //     return {
  //       data: 'ok',
  //     };
  //   } catch (e) {
  //     throw new BadRequestException();
  //   }
  // }

  // @ApiOperation({ description: '나의 찜 리스트에서 삭제' })
  // @Delete(':userId/connections-liked/:connectionId')
  // async detachFromLikePivot(
  //   @Param('userId', ParseIntPipe) userId: number,
  //   @Param('connectionId', ParseIntPipe) connectionId: number,
  // ): Promise<any> {
  //   //? checking if this connection belongs to the user costs a database access,
  //   //? which you can get around if you design your application carefully.
  //   //? so user validation has been removed. keep that in mind.
  //   try {
  //     await this.usersService.detachFromLikePivot(userId, connectionId);
  //     return {
  //       data: 'ok',
  //     };
  //   } catch (e) {
  //     throw new BadRequestException();
  //   }
  // }

  // @ApiOperation({ description: '내가 찜한 발견 리스트' })
  // @PaginateQueryOptions()
  // @Get(':userId/connections-liked')
  // async getConnectionsLikedByMe(
  //   @Param('userId') userId: number,
  //   @Paginate() query: PaginateQuery,
  // ): Promise<Paginated<Connection>> {
  //   const { data, meta, links } = await this.usersService.getConnectionsLikedByMe(
  //     userId,
  //     query,
  //   );

  //   return {
  //     data: data.map((v) => v.connection),
  //     meta: meta,
  //     links: links,
  //   } as Paginated<Connection>;
  // }

  // @ApiOperation({ description: '내가 찜한 발견ID 리스트' })
  // @PaginateQueryOptions()
  // @Get(':userId/connectionids-liked')
  // async getConnectionIdsLikedByMe(
  //   @Param('userId') userId: number,
  // ): Promise<AnyData> {
  //   return this.usersService.getConnectionIdsLikedByMe(userId);
  // }

  //?-------------------------------------------------------------------------//
  //? Connection Report Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 블락 리스트에 추가' })
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
      await this.usersService.attachToReportConnectionPivot(
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

  @ApiOperation({ description: '나의 블락 리스트에서 삭제' })
  @Delete(':userId/connections-reported/:connectionId')
  async detachFromConnectionReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
  ): Promise<any> {
    //? checking if this connection belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachFromReportConnectionPivot(
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

  @ApiOperation({ description: '내가 블락한 발견 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/connections-reported')
  async getConnectionsReportedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    const { data, meta, links } =
      await this.usersService.getConnectionsReportedByMe(userId, query);

    return {
      data: data.map((v) => v.connection),
      meta: meta,
      links: links,
    } as Paginated<Connection>;
  }

  @ApiOperation({ description: '내가 블락한 발견ID 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/connectionids-reported')
  async getConnectionIdsReportedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getConnectionIdsReportedByMe(userId);
  }

  //?-------------------------------------------------------------------------//
  //? User Reaction to Connection Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '발견 reaction' })
  @PaginateQueryOptions()
  @Get(':userId/connections/:connectionId')
  async getReaction(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
  ): Promise<Reaction> {
    return await this.usersService.getReaction(userId, connectionId);
  }

  @ApiOperation({ description: '발견 reaction 리스트' })
  @Get(':userId/reactions')
  async getReactions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
    ids: number[],
  ): Promise<Array<Reaction>> {
    // console.log(dto);
    return await this.usersService.getReactions(userId, ids);
  }

  @ApiOperation({ description: '발견 reaction 리스트에 추가' })
  @Post(':userId/connections/:connectionId')
  async attachToReactionPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: CreateReactionDto, // optional message, and skill
  ): Promise<AnyData> {
    const count = await this.usersService.attachToReactionPivot(
      userId,
      connectionId,
      dto.emotion,
    );
    return {
      data: count,
    };
  }

  @ApiOperation({ description: '발견 reaction 리스트에서 삭제' })
  @Delete(':userId/connections/:connectionId')
  async detachToReactionPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('connectionId', ParseIntPipe) connectionId: number,
    @Body() dto: RemoveReactionDto, // optional message, and skill
  ): Promise<AnyData> {
    const count = await this.usersService.detachFromReactionPivot(
      userId,
      connectionId,
      dto.emotion,
    );
    return {
      data: count,
    };
  }

  // @ApiOperation({ description: '참가신청 리스트에 추가' })
  // @PaginateQueryOptions()
  // @Post(':askingUserId/joins/:askedUserId/connections/:connectionId')
  // async attachToJoinPivot(
  //   @Param('askingUserId', ParseIntPipe) askingUserId: number,
  //   @Param('askedUserId', ParseIntPipe) askedUserId: number,
  //   @Param('connectionId', ParseIntPipe) connectionId: number,
  //   @Body() dto: CreateJoinDto, // optional message, and skill
  // ): Promise<AnyData> {
  //   const connection = await this.usersService.attachToJoinPivot(
  //     askingUserId,
  //     askedUserId,
  //     connectionId,
  //     dto,
  //   );
  //   await this.usersService.upsertCategoryWithSkill(
  //     askingUserId,
  //     connection.subCategory,
  //     dto.skill,
  //   );
  //   return {
  //     data: 'ok',
  //   };
  // }

  // @ApiOperation({ description: '참가신청 승인/거부' })
  // @PaginateQueryOptions()
  // @Patch(':askingUserId/joins/:askedUserId/connections/:connectionId')
  // async updateJoinToAcceptOrDeny(
  //   @Param('askingUserId', ParseIntPipe) askingUserId: number,
  //   @Param('askedUserId', ParseIntPipe) askedUserId: number,
  //   @Param('connectionId', ParseIntPipe) connectionId: number,
  //   @Body() dto: AcceptOrDenyDto,
  // ): Promise<AnyData> {
  //   try {
  //     await this.usersService.updateJoinToAcceptOrDeny(
  //       askingUserId,
  //       askedUserId,
  //       connectionId,
  //       dto.status,
  //       dto.joinType,
  //     );
  //     return {
  //       data: 'ok',
  //     };
  //   } catch (e) {
  //     throw new BadRequestException();
  //   }
  // }

  // @ApiOperation({ description: '보낸 신청 리스트' })
  // @PaginateQueryOptions()
  // @Get(':userId/connections-requested')
  // async getConnectionsRequested(
  //   @Param('userId') userId: number,
  //   @Paginate() query: PaginateQuery,
  // ): Promise<Paginated<Join>> {
  //   const { data, meta, links } = await this.usersService.getConnectionsRequested(
  //     userId,
  //     query,
  //   );

  //   return {
  //     data: data,
  //     meta: meta,
  //     links: links,
  //   }; // as Paginated<Join>;
  // }

  // @ApiOperation({ description: '신청한 발견ID 리스트' })
  // @Get(':userId/connectionids-requested')
  // async getConnectionIdsToJoin(@Param('userId') userId: number): Promise<AnyData> {
  //   return this.usersService.getConnectionIdsRequested(userId);
  // }

  // @ApiOperation({ description: '받은 초대 리스트' })
  // @PaginateQueryOptions()
  // @Get(':userId/connections-invited')
  // async getConnectionsInvited(
  //   @Param('userId') userId: number,
  //   @Paginate() query: PaginateQuery,
  // ): Promise<Paginated<Join>> {
  //   const { data, meta, links } = await this.usersService.getConnectionsInvited(
  //     userId,
  //     query,
  //   );

  //   return {
  //     data: data,
  //     meta: meta,
  //     links: links,
  //   }; // as Paginated<Join>;
  // }

  // @ApiOperation({ description: '초대받은 발견ID 리스트' })
  // @Get(':userId/connectionids-invited')
  // async getConnectionIdsInvited(@Param('userId') userId: number): Promise<AnyData> {
  //   return this.usersService.getConnectionIdsInvited(userId);
  // }
}
