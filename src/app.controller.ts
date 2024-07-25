import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ICounts } from 'src/common/interfaces';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/counts')
  async counts(): Promise<ICounts> {
    return await this.appService.getCounts();
  }

  @Public()
  @Get('/version')
  version(): { version: string } {
    const version = this.appService.getVersion();
    return { version };
  }

  @Public()
  @Get('/bust')
  async bust(): Promise<string> {
    await this.appService.cacheBust();
    return `busted cache store`;
  }

  // @EventPattern('RealTime')
  // async handleRealTimeEvent(data: Record<string, unknown>) {
  //   console.log(data, '<~ redis pubsub subscriber');
  // }
}
