import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Like {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'bigint' })
  public meetupId: number;

  @Column({ type: 'int', unsigned: true })
  public order: number;

  @Column({ length: 16, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.meetupsLiked)
  public user: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.usersLiked)
  public meetup: Meetup;
}
