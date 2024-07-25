import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { ContentComment } from 'src/domain/contents/entities/content_comment.entity';
import { ContentsController } from 'src/domain/contents/contents.controller';
import { ContentsService } from 'src/domain/contents/contents.service';
import { ContentCommentsService } from 'src/domain/contents/content-comments.service';
import { ContentCommentsController } from 'src/domain/contents/content-comments.controller';
import { ViewCountMiddleware } from 'src/domain/contents/middlewares/view-count.middleware';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentComment]), S3Module],
  providers: [ContentsService, ContentCommentsService],
  controllers: [ContentsController, ContentCommentsController],
})
export class ContentsModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(ViewCountMiddleware)
  //     .forRoutes({ path: 'contents/*', method: RequestMethod.GET });
  // }
}
