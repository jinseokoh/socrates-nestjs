import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostComment } from 'src/domain/post-comments/post-comment.entity';
import { PostCommentsController } from 'src/domain/post-comments/post-comments.controller';
import { PostCommentsService } from 'src/domain/post-comments/post-comments.service';
import { Post } from 'src/domain/posts/post.entity';
import { PostsModule } from 'src/domain/posts/posts.module';
import { User } from 'src/domain/users/user.entity';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([PostComment, Post, User]),
    PostsModule,
    FcmModule,
  ],
  providers: [PostCommentsService],
  controllers: [PostCommentsController],
})
export class PostCommentsModule {}
