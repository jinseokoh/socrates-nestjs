import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackModule } from 'nestjs-slack-webhook';
import { ArticleComment } from 'src/domain/article-comments/article-comment.entity';
import { ArticleCommentsController } from 'src/domain/article-comments/article-comments.controller';
import { ArticleCommentsService } from 'src/domain/article-comments/article-comments.service';
import { Article } from 'src/domain/articles/article.entity';
import { FcmModule } from 'src/services/fcm/fcm.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([ArticleComment, Article]),
    SlackModule,
    FcmModule,
  ],
  providers: [ArticleCommentsService],
  controllers: [ArticleCommentsController],
})
export class ArticleCommentsModule {}
