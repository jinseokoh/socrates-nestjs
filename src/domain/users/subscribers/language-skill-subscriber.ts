import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
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
export class LanguageSkillSubscriber
  implements EntitySubscriberInterface<LanguageSkill>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return LanguageSkill;
  }

  //! https://github.com/typeorm/typeorm/issues/3563
  //! you need to use the same entityManager instance because of transactions.
  //! which means event.manager. not event.connection.manager.
  async afterInsert(event: InsertEvent<LanguageSkill>) {
    // console.log(`~~~~~ LanguageSkill model afterInsert subscriber triggered.`);
    await event.manager
      .createQueryBuilder()
      .update(Language)
      .set({ userCount: () => 'userCount + 1' })
      .where({ id: event.entity.languageId })
      .execute();
  }
}
