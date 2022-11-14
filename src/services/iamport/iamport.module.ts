import { Module } from '@nestjs/common';
import { IamportService } from 'src/services/iamport/iamport.service';

@Module({
  exports: [IamportService],
  providers: [IamportService],
})
export class IamportModule {}
