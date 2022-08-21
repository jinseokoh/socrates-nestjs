import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Post } from 'src/domain/posts/post.entity';
import { PostsController } from 'src/domain/posts/posts.controller';
import { PostsService } from 'src/domain/posts/posts.service';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [TypeOrmModule.forFeature([Post, Auction]), S3Module],
  exports: [PostsService],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
