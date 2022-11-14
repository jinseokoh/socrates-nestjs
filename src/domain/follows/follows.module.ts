import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsController } from 'src/domain/follows/follows.controller';
import { FollowsService } from 'src/domain/follows/follows.service';
import { User } from '../users/user.entity';
import { Follow } from './follow.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Follow, User])],
  providers: [FollowsService],
  controllers: [FollowsController],
})
export class FollowsModule {}
