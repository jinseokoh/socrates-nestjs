import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can report meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class ReportMeetup {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public meetupId: number;

  @Column({ length: 32, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.meetupReports, { cascade: true })
  public user: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.userReports, { cascade: true })
  public meetup: Meetup;
}
