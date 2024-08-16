import { User } from 'src/domain/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

//? a User can bookmark another User
//? 모델사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_recipient_id_key', ['userId', 'recipientId'])
export class BookmarkUserUser {
  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @PrimaryColumn({ type: 'int', unsigned: true })
  recipientId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.followings, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => User, (user) => user.followers, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public recipient: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<BookmarkUserUser>) {
    Object.assign(this, partial);
  }
}
