import { Ledger as LedgerType } from 'src/common/enums';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return User;
  }

  //! https://github.com/typeorm/typeorm/issues/3563
  //! you need to use the same entityManager instance because of transactions.
  //! which means event.manager. not event.connection.manager.
  async afterInsert(event: InsertEvent<User>) {
    console.log(`~~~~~ after inserting User`);
    await event.manager
      .createQueryBuilder()
      .insert()
      .into(Profile)
      .values([
        {
          userId: event.entity.id,
        },
      ])
      .execute();

    await event.manager
      .createQueryBuilder()
      .insert()
      .into(Ledger)
      .values([
        {
          debit: 10,
          balance: 10,
          ledgerType: LedgerType.DEBIT_REWARD,
          note: '10 coins granted',
          userId: event.entity.id,
        },
      ])
      .execute();
  }
}
