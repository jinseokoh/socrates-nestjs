import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
@Controller()
export class AppController {
  @Public()
  @Get()
  index(): string {
    return `Welcome to MeetSocrates v1 API ${process.env.APP_TYPE}, a work of GoK (v${process.env.APP_VERSION})`;
  }

  @Public()
  @Get('/version')
  version(): string {
    return process.env.APP_VERSION;
  }

  // @EventPattern('RealTime')
  // async handleRealTimeEvent(data: Record<string, unknown>) {
  //   console.log(data, '<~ redis pubsub subscriber');
  // }
}
