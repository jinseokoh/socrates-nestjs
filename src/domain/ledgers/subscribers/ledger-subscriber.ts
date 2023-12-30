import { Ledger as LedgerType } from 'src/common/enums';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class LedgerSubscriber implements EntitySubscriberInterface<Ledger> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return Ledger;
  }

  //! https://github.com/typeorm/typeorm/issues/3563
  //! you need to use the same entityManager instance because of transactions.
  //! which means you should use event.manager. not event.connection.manager.
  async afterInsert(event: InsertEvent<Ledger>) {
    // console.log(`~~~~~ Ledger model afterInsert subscriber triggered.`);
    if (event.entity.ledgerType === LedgerType.DEBIT_PURCHASE) {
      await event.manager
        .createQueryBuilder()
        .update(Profile)
        .set({
          balance: event.entity.balance,
          payCount: () => 'payCount + 1',
        })
        .where('userId = :userId', { userId: event.entity.userId })
        .execute();
    } else {
      await event.manager
        .createQueryBuilder()
        .update(Profile)
        .set({
          balance: event.entity.balance,
        })
        .where('userId = :userId', { userId: event.entity.userId })
        .execute();
    }
  }
}
