import { Controller, Get, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { migrateRooms } from 'src/dynamodb/migrate/rooms';
import { migrateUsers } from 'src/dynamodb/migrate/users';
import { migrateMessages } from './dynamodb/migrate/messages';
@Controller()
export class AppController {
  @Public()
  @Get()
  index(): string {
    return `Welcome to MeetSage v1 API ${process.env.APP_TYPE}, a work of GoK (v${process.env.APP_VERSION})`;
  }

  @Public()
  @Get('/version')
  version(): string {
    return process.env.APP_VERSION;
  }

  @Public()
  @Post('/migrate')
  async migrate(): Promise<void> {
    await migrateUsers();
    await migrateRooms();
    await migrateMessages();
  }

  // @EventPattern('RealTime')
  // async handleRealTimeEvent(data: Record<string, unknown>) {
  //   console.log(data, '<~ redis pubsub subscriber');
  // }
}
