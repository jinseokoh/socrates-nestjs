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
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { AnyData } from 'src/common/types';
import { ReportUserMeetupService } from 'src/domain/users/report_user_meetup.service';
import { CreateFlagDto } from 'src/domain/users/dto/create-flag.dto';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { ReportUserMeetup } from 'src/domain/users/entities/report_user_meetup.entity';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class ReportUserMeetupController {
  constructor(
    private readonly reportUserMeetupService: ReportUserMeetupService,
  ) {}

  //?-------------------------------------------------------------------------//
  //? ReportUserMeetup Pivot
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 북마크에서 meetup 추가' })
  @Post(':userId/report_user_meetup/:meetupId')
  async attach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
    @Body('message') message: string | null,
  ): Promise<any> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.reportUserMeetupService.attach(
        userId,
        meetupId,
        message,
      );
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '나의 북마크에서 meetup 제거' })
  @Delete(':userId/report_user_meetup/:meetupId')
  async detach(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<AnyData> {
    //? checking if this meetup belongs to the user costs a database access,
    //? which you can get around if you design your application carefully.
    //? so user validation has been removed. keep that in mind.
    try {
      return await this.reportUserMeetupService.detach(userId, meetupId);
    } catch (e) {
      throw new BadRequestException();
    }
  }

  @ApiOperation({ description: '내가 북마크한 meetup 리스트 (paginated)' })
  @Get(':userId/report_user_meetup')
  async getUsersReportedByMe(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ReportUserMeetup>> {
    return this.reportUserMeetupService.getMeetupsReportedByMe(userId, query);
  }

  @ApiOperation({ description: '내가 북마크한 meetupIds 리스트' })
  @Get(':userId/report_user_meetup/ids')
  async getAllUserIdsReportedByMe(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<number[]> {
    return await this.reportUserMeetupService.getAllIdsReportedByMe(userId);
  }

  @ApiOperation({
    description: '내가 북마크한 meetup 여부',
  })
  @Get(':userId/report_user_meetup/:meetupId')
  async isReported(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('meetupId', ParseIntPipe) meetupId: number,
  ): Promise<AnyData> {
    return this.reportUserMeetupService.isReported(userId, meetupId);
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
    return await this.reportUserMeetupService.createFlag({ ...dto, userId });
  }
}
