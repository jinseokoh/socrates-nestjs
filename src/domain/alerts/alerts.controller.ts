import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CreateAlertDto } from 'src/domain/alerts/dto/create-alert.dto';
import { AlertsService } from 'src/domain/alerts/alerts.service';
import { IAlert, IAlertKey } from 'src/domain/alerts/entities/alert.interface';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Alert 생성' })
  @Post()
  async create(@Body() createAlertDto: CreateAlertDto): Promise<IAlert> {
    return await this.alertsService.create(createAlertDto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Alert 리스트' })
  @Get(':userId')
  async fetch(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('lastId') lastId: string | undefined,
  ): Promise<any> {
    const lastKey = lastId
      ? {
          userId,
          id: lastId,
        }
      : null;

    console.log(`userId =`, userId, `lastKey =`, lastKey ?? 'null'); // todo. remove this log
    const res = await this.alertsService.fetch(userId, lastKey);
    console.log(`res`, res); // todo. remove this log

    return {
      lastKey: res.lastKey,
      count: res.count,
      items: res,
    };
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'Alert 삭제' })
  @Delete(':userId/:id')
  async delete(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('id') id: string,
  ): Promise<any> {
    const key = {
      userId: userId,
      id: id,
    } as IAlertKey;

    await this.alertsService.delete(key);
    return {
      data: 'ok',
    };
  }
}
