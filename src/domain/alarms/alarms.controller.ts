import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CreateAlarmDto } from 'src/domain/alarms/dto/create-alarm.dto';
import { AlarmsService } from 'src/domain/alarms/alarms.service';
import { IAlarm, IAlarmKey } from 'src/domain/alarms/entities/alarm.interface';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Alarm 생성' })
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() createAlarmDto: CreateAlarmDto,
  ): Promise<IAlarm> {
    const dto = { ...createAlarmDto };
    if (!dto.hasOwnProperty('userId')) {
      dto['userId'] = userId;
    }
    return await this.alarmsService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Alarm 리스트' })
  @Get()
  async fetch(
    @CurrentUserId() userId: number,
    @Query('lastId') lastId: string | undefined,
  ): Promise<any> {
    const lastKey = lastId
      ? {
          userId,
          id: lastId,
        }
      : null;

    console.log(`userId =`, userId, `lastKey =`, lastKey ?? 'null'); // todo. remove this log
    const res = await this.alarmsService.fetch(userId, lastKey);
    console.log(`res`, res); // todo. remove this log

    return {
      lastKey: res.lastKey,
      count: res.count,
      items: res,
    };
  }

  @ApiOperation({ description: 'Banner 상세보기' })
  @Get(':id')
  async getAlarmById(@Param('id') id: number): Promise<IAlarm> {
    throw new Error('My first Sentry error!');
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Alarm 삭제' })
  @Delete(':id')
  async delete(
    @CurrentUserId() userId: number,
    @Param('id') id: string,
  ): Promise<any> {
    const key = {
      userId: userId,
      id: id,
    } as IAlarmKey;

    await this.alarmsService.delete(key);
    return {
      data: 'ok',
    };
  }
}
