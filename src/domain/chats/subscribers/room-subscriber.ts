import { Room } from 'src/domain/chats/entities/room.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class RoomSubscriber implements EntitySubscriberInterface<Room> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return Room;
  }

  //! https://github.com/typeorm/typeorm/issues/3563
  //! you need to use the same entityManager instance because of transactions.
  //! which means event.manager. not event.connection.manager.
  async afterUpdate(event: UpdateEvent<Room>) {
    // console.log(`~~~~~ Room model afterUpdate subscriber triggered.`);
    if (event.entity.appointedAt !== null) {
      await event.manager
        .createQueryBuilder()
        .update(Meetup)
        .set({
          appointedAt: event.entity.appointedAt,
        })
        .where('id = :meetupId', { meetupId: event.entity.meetupId })
        .execute();
    }
  }
}
