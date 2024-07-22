import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// user can hate other user
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_target_user_id_key', ['userId', 'targetUserId'])
export class Hate {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  targetUserId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.usersHating)
  public user: User;

  @ManyToOne(() => User, (user) => user.usersHated)
  public targetUser: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Hate>) {
    Object.assign(this, partial);
  }
}
