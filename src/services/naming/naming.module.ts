import { Module } from '@nestjs/common';
import { NamingService } from 'src/services/naming/naming.service';

@Module({
  exports: [NamingService],
  providers: [NamingService],
})
export class NamingModule {}
