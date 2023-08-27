import { Exclude } from 'class-transformer';
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
@Unique('guest_id_meetup_id_user_id_key', ['meetupId', 'guestId', 'userId'])
export class Impression {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', unsigned: true, nullable: true })
  meetupId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, nullable: true })
  guestId: number | null; // to make it available to Repository.

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.impressions, {
    onDelete: 'CASCADE',
  })
  user?: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Impression>) {
    Object.assign(this, partial);
  }
}
