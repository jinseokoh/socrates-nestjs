import { User } from 'src/domain/users/entities/user.entity';

export class FriendAttachedEvent {
  token: string | null;
  options: object;
  notification: {
    title: string;
    body: string;
  };
}
