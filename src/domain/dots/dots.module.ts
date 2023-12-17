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
import { Connection } from 'src/domain/users/entities/connection.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Dot, Connection, Remark])],
  providers: [DotsService, ConnectionsService, RemarksService],
  controllers: [
    DotsController,
    ConnectionsController,
    ConnectionRemarksController,
  ],
})
export class DotsModule {}
