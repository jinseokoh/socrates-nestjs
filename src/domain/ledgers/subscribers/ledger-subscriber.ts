import { Ledger as LedgerType } from 'src/common/enums';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
} from 'typeorm';

@EventSubscriber()
export class LedgerSubscriber implements EntitySubscriberInterface<Ledger> {
  listenTo() {
    return Ledger;
  }

  async afterInsert(event: InsertEvent<Ledger>) {
    const repository: Repository<Profile> =
      event.connection.manager.getRepository<Profile>('profile');

    if (event.entity.ledgerType === LedgerType.DEBIT_PURCHASE) {
      repository
        .createQueryBuilder()
        .update(Profile)
        .set({
          balance: event.entity.balance,
          payCount: () => 'payCount + 1',
        })
        .where('userId = :userId', { userId: event.entity.userId })
        .execute();
    } else {
      repository
        .createQueryBuilder()
        .update(Profile)
        .set({
          balance: event.entity.balance,
        })
        .where('userId = :userId', { userId: event.entity.userId })
        .execute();
    }

    // see https://github.com/typeorm/typeorm/issues/447
    repository
      .createQueryBuilder()
      .update(Profile)
      .set({
        balance: event.entity.balance,
      })
      .where('userId = :userId', { userId: event.entity.userId })
      .execute();
  }
}
