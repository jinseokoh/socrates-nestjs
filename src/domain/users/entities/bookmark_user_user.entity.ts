import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

//? a User can bookmark another User
//? 모델사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_bookmarked_user_id_key', ['userId', 'bookmarkedUserId'])
export class BookmarkUserUser {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  bookmarkedUserId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.userBookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => User, (user) => user.bookmarkedByUsers, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public bookmarkedUser: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<BookmarkUserUser>) {
    Object.assign(this, partial);
  }
}
