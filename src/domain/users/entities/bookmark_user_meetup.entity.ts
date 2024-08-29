import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

//? a user can bookmark Meetup
//? 모델 사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_meetup_id_key', ['userId', 'meetupId'])
export class Bookmark {
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  meetupId: number;

  @CreateDateColumn()
  createdAt: Date;

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

  constructor(partial: Partial<Bookmark>) {
    Object.assign(this, partial);
  }
}
