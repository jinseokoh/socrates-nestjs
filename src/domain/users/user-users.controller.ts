import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UsersService } from 'src/domain/users/users.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { ReportUser } from 'src/domain/users/entities/report_user.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { JoinStatus } from 'src/common/enums';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateFriendRequestDto } from 'src/domain/users/dto/create-friend-request.dto';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserUsersController {
  constructor(private readonly usersService: UsersService) {}

  //?-------------------------------------------------------------------------//
  //? Friendship Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '친구신청 리스트에 추가' })
  @PaginateQueryOptions()
  @Post(':senderId/friendship/:recipientId')
  async attachToFriendshipPivot(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body() dto: CreateFriendRequestDto,
  ): Promise<AnyData> {
    await this.usersService.attachToFriendshipPivot(senderId, recipientId, dto);
    return {
      data: 'ok',
    };
  }

  @ApiOperation({ description: '친구신청 승인/거부' })
  @PaginateQueryOptions()
  @Patch(':senderId/friendship/:recipientId')
  async updateFriendshipToAcceptOrDeny(
    @Param('senderId', ParseIntPipe) senderId: number,
    @Param('recipientId', ParseIntPipe) recipientId: number,
    @Body('status') status: JoinStatus, // optional message, and skill
  ): Promise<AnyData> {
    try {
      await this.usersService.updateFriendshipWithStatus(
        senderId,
        recipientId,
        status,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '보낸 친구신청 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/friendship-sent')
  async getFriendshipSenders(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const { data, meta, links } = await this.usersService.getFriendshipSent(
      userId,
      query,
    );

    return {
      data: data,
      meta: meta,
      links: links,
    };
  }

  @ApiOperation({ description: '받은 친구신청 리스트' })
  @PaginateQueryOptions()
  @Get(':userId/friendship-received')
  async getFriendshipRecipients(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Friendship>> {
    const { data, meta, links } = await this.usersService.getFriendshipReceived(
      userId,
      query,
    );

    return {
      data: data,
      meta: meta,
      links: links,
    };
  }

  //?-------------------------------------------------------------------------//
  //? Hate Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '블락한 사용자 리스트에 추가' })
  @Post(':userId/users-hated/:otherId')
  async attachUserIdToHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.attachUserIdToHatePivot(userId, otherId, message);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '블락한 사용자 리스트에서 삭제' })
  @Delete(':userId/users-hated/:otherId')
  async detachUserIdFromHatePivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachUserIdFromHatePivot(userId, otherId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 블락한 사용자 리스트' })
  @Get(':userId/users-hated')
  async getUsersHatedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Hate>> {
    return this.usersService.getUsersHatedByMe(userId, query);
  }

  @ApiOperation({ description: '내가 블락한 사용자ID 리스트' })
  @Get(':userId/userids-hated')
  async getUserIdsHatedByMe(@Param('userId') userId: number): Promise<AnyData> {
    return this.usersService.getUserIdsEitherHatingOrBeingHated(userId);
  }

  //?-------------------------------------------------------------------------//
  //? Report Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '블락한 사용자 리스트에 추가' })
  @Post(':userId/reports/:otherId')
  async attachUserIdToReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.attachUserIdToReportUserPivot(
        userId,
        otherId,
        message,
      );
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '블락한 사용자 리스트에서 삭제' })
  @Delete(':userId/reports/:otherId')
  async detachUserIdFromReportPivot(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('otherId', ParseIntPipe) otherId: number,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      await this.usersService.detachUserIdFromReportUserPivot(userId, otherId);
      return {
        data: 'ok',
      };
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 신고한 사용자 리스트' })
  @Get(':userId/users-reported')
  async getUsersBeingReportedByMe(
    @Param('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ReportUser>> {
    return this.usersService.getUsersBeingReportedByMe(userId, query);
  }

  @ApiOperation({ description: '내가 신고한 사용자ID 리스트' })
  @Get(':userId/userids-reported')
  async getUserIdsBeingReportedByMe(
    @Param('userId') userId: number,
  ): Promise<AnyData> {
    return this.usersService.getUserIdsBeingReportedByMe(userId);
  }
}
