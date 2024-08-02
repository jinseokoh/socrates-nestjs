import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { ContentComment } from 'src/domain/contents/entities/content_comment.entity';
import { ContentsController } from 'src/domain/contents/contents.controller';
import { ContentsService } from 'src/domain/contents/contents.service';
import { S3Module } from 'src/services/aws/s3.module';
import { ContentCommentUsersController } from 'src/domain/contents/content_comment-users.controller';
import { ContentCommentUsersService } from 'src/domain/contents/content_comment-users.service';
@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentComment]), S3Module],
  providers: [ContentsService, ContentCommentUsersService],
  controllers: [ContentsController, ContentCommentUsersController],
})
export class ContentsModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(ViewCountMiddleware)
  //     .forRoutes({ path: 'contents/*', method: RequestMethod.GET });
  // }
}
