import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ReportUserUser } from 'src/domain/users/entities/report_user_user.entity';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { ReportUserUserService } from 'src/domain/users/report_user_user.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class ReportUserUserController {
  constructor(private readonly reportUserUserService: ReportUserUserService) {}

  //?-------------------------------------------------------------------------//
  //? ReportUserUser Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 북마크에서 user 추가' })
  @Post(':userId/report_user_user/:reportedUserId')
  async attach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('reportedUserId', ParseIntPipe) reportedUserId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.reportUserUserService.attach(
        userId,
        reportedUserId,
        message,
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 북마크에서 user 제거' })
  @Delete(':userId/report_user_user/:reportedUserId')
  async detach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('reportedUserId', ParseIntPipe) reportedUserId: number,
  ): Promise<AnyData> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.reportUserUserService.detach(userId, reportedUserId);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 북마크한 user 리스트 (paginated)' })
  @Get(':userId/report_user_user')
  async getUsersReportedByMe(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ReportUserUser>> {
    return await this.reportUserUserService.getUsersReportedByMe(userId, query);
  }

  @ApiOperation({ description: '내가 북마크한 userIds 리스트' })
  @Get(':userId/report_user_user/ids')
  async getAllUserIdsReportedByMe(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.reportUserUserService.getAllIdsReportedByMe(userId);
  }

  @ApiOperation({
    description: '내가 북마크한 user 여부',
  })
  @Get(':userId/report_user_user/:reportedUserId')
  async isReported(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('reportedUserId', ParseIntPipe) reportedUserId: number,
  ): Promise<AnyData> {
    return this.reportUserUserService.isReported(userId, reportedUserId);
  }

  //?-------------------------------------------------------------------------//
  //? 내가 만든 발견 리스트
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '사용자 댓글 신고' })
  @Post(':userId/flags')
  async createFlagOpinion(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateFlagDto,
  ): Promise<Flag> {
    return await this.reportUserUserService.createFlag({ ...dto, userId });
  }
}
