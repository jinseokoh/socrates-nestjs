import { Module } from '@nestjs/common';
import { SesService } from 'src/services/aws/ses.service';
@Module({
  providers: [SesService],
  exports: [SesService],
})
export class SesModule {}
