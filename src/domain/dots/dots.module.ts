import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionRemarksController } from 'src/domain/dots/connection-remarks.controller';
import { ConnectionsController } from 'src/domain/dots/connections.controller';
import { ConnectionsService } from 'src/domain/dots/connections.service';
import { DotsController } from 'src/domain/dots/dots.controller';
import { DotsService } from 'src/domain/dots/dots.service';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Remark } from 'src/domain/dots/entities/remark.entity';
import { RemarksService } from 'src/domain/dots/remarks.service';
import { Connection } from 'src/domain/dots/entities/connection.entity';
import { S3Module } from 'src/services/aws/s3.module';
import { FcmModule } from 'src/services/fcm/fcm.module';
import { Poll } from 'src/domain/dots/entities/poll.entity';
import { PollsService } from 'src/domain/dots/polls.service';
import { PollsController } from 'src/domain/dots/polls.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([Dot, Poll, Connection, Remark]),
    S3Module,
    FcmModule,
  ],
  providers: [DotsService, PollsService, ConnectionsService, RemarksService],
  controllers: [
    DotsController,
    PollsController,
    ConnectionsController,
    ConnectionRemarksController,
  ],
})
export class DotsModule {}
