import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { Answer } from 'src/domain/icebreakers/entities/answer.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Profile } from 'src/domain/users/entities/profile.entity';

@EventSubscriber()
export class AnswerSubscriber implements EntitySubscriberInterface<Answer> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return Answer;
  }

  async afterInsert(event: InsertEvent<Answer>) {
    if (event.entity.choices === null) {
      //? shortAnswer
      await event.manager
        .createQueryBuilder()
        .update(Question)
        .set({
          answerCount: () => 'answerCount + 1',
        })
        .where('id = :id', { id: event.entity.answerId })
        .execute();
    } else {
      //? multiChoice
      const dot = await event.manager.getRepository(Question).findOne({
        where: {
          id: event.entity.answerId,
        },
      });
      if (dot) {
        const aggregatedChoices = question.aggregatedChoices || {};
        event.entity.choices.forEach((v) => {
          aggregatedChoices[v] = (aggregatedChoices[v] || 0) + 1;
        });
        await event.manager
          .createQueryBuilder()
          .update(Question)
          .set({
            aggregatedChoices: aggregatedChoices,
            answerCount: () => 'answerCount + 1',
          })
          .where('id = :id', { id: event.entity.answerId })
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
