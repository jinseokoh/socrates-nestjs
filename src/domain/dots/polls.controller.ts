import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { PollsService } from 'src/domain/dots/polls.service';
import { CreatePollDto } from 'src/domain/dots/dto/create-poll.dto';
import { UpdatePollDto } from 'src/domain/dots/dto/update-poll.dto';
import { Poll } from 'src/domain/dots/entities/poll.entity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '커넥션 질문 추가' })
  @Post()
  async createConnection(
    @CurrentUserId() userId: number,
    @Body() dto: CreatePollDto,
  ): Promise<Poll> {
    try {
      return await this.pollsService.create({ ...dto });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @Public()
  @ApiOperation({ description: 'Poll List' })
  @Get()
  async getAll(): Promise<Array<Poll>> {
    return await this.pollsService.getAll();
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Poll 갱신' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePollDto,
  ): Promise<any> {
    return await this.pollsService.update(id, dto);
  }
}
