import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// user can hate other user
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_recipient_id_key', ['userId', 'recipientId'])
export class Hate {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  recipientId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.sentBans)
  public user: User;

  @ManyToOne(() => User, (user) => user.receivedBans)
  public recipient: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Hate>) {
    Object.assign(this, partial);
  }
}
