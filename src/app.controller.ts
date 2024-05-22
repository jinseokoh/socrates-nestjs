import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Public } from 'src/common/decorators/public.decorator';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/counts')
  async counts(): Promise<{
    users: number;
    meetups: number;
    dots: number;
    connections: number;
  }> {
    return await this.appService.getCounts();
  }

  @Public()
  @Get('/version')
  version(): { version: string } {
    const version = this.appService.getVersion();
    return { version };
  }

  // @EventPattern('RealTime')
  // async handleRealTimeEvent(data: Record<string, unknown>) {
  //   console.log(data, '<~ redis pubsub subscriber');
  // }
}
