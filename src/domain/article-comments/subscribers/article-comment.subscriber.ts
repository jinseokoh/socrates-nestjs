import { ArticleComment } from 'src/domain/article-comments/article-comment.entity';
import { Article } from 'src/domain/articles/article.entity';

import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
} from 'typeorm';

@EventSubscriber()
export class ArticleCommentSubscriber
  implements EntitySubscriberInterface<ArticleComment>
{
  listenTo() {
    return ArticleComment;
  }

  async afterInsert(event: InsertEvent<ArticleComment>) {
    const articlesRepository: Repository<Article> =
      event.connection.manager.getRepository<Article>('article');

    articlesRepository
      .createQueryBuilder()
      .update(Article)
      .where('id = :id', { id: event.entity.articleId })
      .set({ commentCount: () => 'commentCount + 1' })
      .execute();
  }
}
