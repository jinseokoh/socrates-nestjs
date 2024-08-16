import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

//? a User can bookmark Icebreaker
//? 모델사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_icebreaker_id_key', ['userId', 'icebreakerId'])
export class BookmarkUserIcebreaker {
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  icebreakerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.icebreakerBookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => Icebreaker, (icebreaker) => icebreaker.bookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public icebreaker: Icebreaker;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<BookmarkUserIcebreaker>) {
    Object.assign(this, partial);
  }
}
