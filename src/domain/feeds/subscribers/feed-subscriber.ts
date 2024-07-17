import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Dot } from 'src/domain/feeds/entities/dot.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class FeedSubscriber
  implements EntitySubscriberInterface<Feed>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return Feed;
  }

  async afterInsert(event: InsertEvent<Feed>) {
    if (event.entity.choices === null) {
      //? shortAnswer
      await event.manager
        .createQueryBuilder()
        .update(Dot)
        .set({
          answerCount: () => 'answerCount + 1',
        })
        .where('id = :id', { id: event.entity.dotId })
        .execute();
    } else {
      //? multiChoice
      const dot = await event.manager.getRepository(Dot).findOne({
        where: {
          id: event.entity.dotId,
        },
      });
      if (dot) {
        const aggregatedChoices = dot.aggregatedChoices || {};
        event.entity.choices.forEach((v) => {
          aggregatedChoices[v] = (aggregatedChoices[v] || 0) + 1;
        });
        await event.manager
          .createQueryBuilder()
          .update(Dot)
          .set({
            aggregatedChoices: aggregatedChoices,
            answerCount: () => 'answerCount + 1',
          })
          .where('id = :id', { id: event.entity.dotId })
          .execute();
      }
    }
    // const userId = event.entity.userId;
    await event.manager
      .createQueryBuilder()
      .update(Profile)
      .set({
        postCount: () => 'postCount + 1',
      })
      .where('userId = :userId', { userId: event.entity.userId })
      .execute();
  }
}
