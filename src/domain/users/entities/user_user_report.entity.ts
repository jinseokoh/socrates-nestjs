import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

// a User can report User
// 모델사용을 위해, many-to-many 대신 one-to-many 선호
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class UserUserReport {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  accusedUserId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.userReports, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'userId' })
  public user: User;

  @ManyToOne(() => User, (user) => user.reportedByUsers, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'accusedUserId' })
  public accusedUser: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<UserUserReport>) {
    Object.assign(this, partial);
  }
}
