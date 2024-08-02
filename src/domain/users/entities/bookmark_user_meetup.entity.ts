import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

//? a user can bookmark Meetup
//? 모델 사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_meetup_id_key', ['userId', 'meetupId'])
export class BookmarkUserMeetup {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  meetupId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.meetupBookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.bookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public meetup: Meetup;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<BookmarkUserMeetup>) {
    Object.assign(this, partial);
  }
}
