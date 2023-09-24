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
@Unique('poster_id_meetup_id_user_id_key', ['posterId', 'userId'])
export class Impression {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
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

  @Column({ length: 32, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', unsigned: true, nullable: true })
  posterId: number | null; // to make it available to Repository.

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
