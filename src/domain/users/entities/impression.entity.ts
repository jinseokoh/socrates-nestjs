import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
@Unique('user_id_recipient_id_key', ['userId', 'recipientId'])
export class Impression {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  recipientId: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  appearance: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  knowledge: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  confidence: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  humor: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  manner: number;

  @Column({ length: 80, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @ManyToOne(() => User, (user) => user.sentImpressions, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => User, (user) => user.receivedImpressions, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public recipient: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Impression>) {
    Object.assign(this, partial);
  }
}
