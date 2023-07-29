import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can dislike meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Dislike {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'bigint', unsigned: true })
  public meetupId: number;

  @Column({ length: 16, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.meetupsDisliked)
  public user: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.usersDisliked)
  public meetup: Meetup;
}
