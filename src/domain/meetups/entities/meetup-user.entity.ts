import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class MeetupUser {
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  public user!: User;

  @PrimaryColumn({ type: 'uuid', length: 36 })
  public meetupId!: string;

  @ManyToOne(() => Meetup, (meetup) => meetup.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;
}
