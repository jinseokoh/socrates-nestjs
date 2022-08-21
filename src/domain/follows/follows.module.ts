import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsController } from 'src/domain/follows/follows.controller';
import { FollowsService } from 'src/domain/follows/follows.service';
import { UsersModule } from 'src/domain/users/users.module';
import { User } from '../users/user.entity';
import { Follow } from './follow.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Follow, User]), UsersModule],
  providers: [FollowsService],
  controllers: [FollowsController],
})
export class FollowsModule {}
