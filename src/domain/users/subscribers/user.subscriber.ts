import { Profile } from 'src/domain/profiles/profile.entity';
import { User } from 'src/domain/users/user.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
} from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  async afterInsert(event: InsertEvent<User>) {
    const profileRepository: Repository<Profile> =
      event.connection.manager.getRepository<Profile>('profile');

    // see https://github.com/typeorm/typeorm/issues/447
    profileRepository
      .createQueryBuilder()
      .insert()
      .into(Profile)
      .values([
        {
          userId: event.entity.id,
        },
      ])
      .execute();
  }
}
