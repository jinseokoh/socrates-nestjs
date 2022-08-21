import { Module } from '@nestjs/common';
import { SesProvider } from 'src/services/aws/ses.provider';
@Module({
  providers: [...SesProvider],
  exports: [...SesProvider],
})
export class SesModule {}
