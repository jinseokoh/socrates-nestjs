import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionRemarksController } from 'src/domain/connections/connection-remarks.controller';
import { ConnectionsController } from 'src/domain/connections/connections.controller';
import { ConnectionsService } from 'src/domain/connections/connections.service';
import { DotsController } from 'src/domain/connections/dots.controller';
import { DotsService } from 'src/domain/connections/dots.service';
import { Dot } from 'src/domain/connections/entities/dot.entity';
import { Remark } from 'src/domain/connections/entities/remark.entity';
import { RemarksService } from 'src/domain/connections/remarks.service';
import { Connection } from 'src/domain/connections/entities/connection.entity';
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
