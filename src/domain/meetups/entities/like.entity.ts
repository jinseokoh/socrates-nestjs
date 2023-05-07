import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Like {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: number;

  @Column({ length: 16, nullable: true })
  message: string | null;

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @Column({ type: 'bigint' })
  public meetupId: number;

  @ManyToOne(() => User, (user) => user.meetupsLiked)
  public user: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.usersLiked)
  public meetup: Meetup;
}
