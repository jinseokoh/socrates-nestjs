import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlagsController } from 'src/domain/flags/flags.controller';
import { FlagsService } from 'src/domain/flags/flags.service';
import { Flag } from 'src/domain/flags/entities/flag.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Flag, Feed, Meetup, Comment, Thread, User]),
  ],
  exports: [FlagsService],
  providers: [FlagsService],
  controllers: [FlagsController],
})
export class FlagsModule {}
