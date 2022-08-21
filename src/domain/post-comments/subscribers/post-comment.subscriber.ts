import { PostComment } from 'src/domain/post-comments/post-comment.entity';
import { Post } from 'src/domain/posts/post.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
} from 'typeorm';

@EventSubscriber()
export class PostCommentSubscriber
  implements EntitySubscriberInterface<PostComment>
{
  listenTo() {
    return PostComment;
  }

  async afterInsert(event: InsertEvent<PostComment>) {
    const postsRepository: Repository<Post> =
      event.connection.manager.getRepository<Post>('post');

    postsRepository
      .createQueryBuilder()
      .update(Post)
      .where('id = :id', { id: event.entity.postId })
      .set({ commentCount: () => 'commentCount + 1' })
      .execute();
  }
}
