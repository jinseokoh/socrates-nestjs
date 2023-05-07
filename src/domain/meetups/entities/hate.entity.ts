import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Hate {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @Column({ type: 'uuid', length: 36 })
  public meetupId: string;

  @ManyToOne(() => User, (user) => user.meetupsHated)
  public user: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.usersHated)
  public meetup: Meetup;
}
