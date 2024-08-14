import { Fluency } from 'src/domain/languages/entities/fluency.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Language } from 'src/domain/languages/entities/language.entity';

//? important notes
//?
//? repository.upsert() fires afterInsert event everytime it runs
//? so the isolation between insert and update is IMPOSSIBLE at
//? TypeORM level

@EventSubscriber()
export class FluencySubscriber
  implements EntitySubscriberInterface<Fluency>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return Fluency;
  }

  //! https://github.com/typeorm/typeorm/issues/3563
  //! you need to use the same entityManager instance because of transactions.
  //! which means event.manager. not event.connection.manager.
  async afterInsert(event: InsertEvent<Fluency>) {
    // console.log(`~~~~~ Fluency model afterInsert subscriber triggered.`);
    await event.manager
      .createQueryBuilder()
      .update(Language)
      .set({ userCount: () => 'userCount + 1' })
      .where({ id: event.entity.languageId })
      .execute();
  }
}
