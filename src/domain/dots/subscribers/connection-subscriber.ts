import { Connection } from 'src/domain/dots/entities/connection.entity';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class ConnectionSubscriber
  implements EntitySubscriberInterface<Connection>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return Connection;
  }

  async afterInsert(event: InsertEvent<Connection>) {
    await event.manager
      .createQueryBuilder()
      .update(Dot)
      .set({
        answerCount: () => 'answerCount + 1',
      })
      .where('id = :id', { id: event.entity.dotId })
      .execute();
  }
}
