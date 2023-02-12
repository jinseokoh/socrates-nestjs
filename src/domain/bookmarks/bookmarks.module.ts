import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksController } from 'src/domain/bookmarks/bookmarks.controller';
import { BookmarksService } from 'src/domain/bookmarks/bookmarks.service';
import { Bookmark } from 'src/domain/bookmarks/entities/bookmark.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Bookmark, Meetup, User]),
    // RedisModule.register({ name: REDIS_PUBSUB_CLIENT }),
    // RmqModule.register({ name: RABBITMQ_CLIENT }),
  ],
  providers: [BookmarksService],
  controllers: [BookmarksController],
})
export class BookmarksModule {}
