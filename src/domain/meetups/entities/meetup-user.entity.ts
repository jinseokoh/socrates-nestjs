import { Exclude } from 'class-transformer';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class MeetupUser {
  @Exclude()
  @Column({ default: false })
  public approve: boolean;

  @Exclude()
  @Column({ default: false })
  public bookmark: boolean;

  @Exclude()
  @PrimaryColumn({ type: 'uuid', length: 36 })
  public userId!: string;
  @ManyToOne(() => User, (user) => user.meetups)
  public user!: User;

  @Exclude()
  @PrimaryColumn({ type: 'uuid', length: 36 })
  public meetupId!: string;
  @ManyToOne(() => Meetup, (meetup) => meetup.meetupUsers)
  public meetup!: Meetup;
}
