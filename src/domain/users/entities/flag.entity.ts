import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

//? 댓글 user, meetup, feed, thread, comment 신고
@Entity()
@Unique('user_id_entity_type_entity_id_key', [
  'userId',
  'entityType',
  'entityId',
])
export class Flag {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @Column({ length: 32, nullable: false })
  entityType: string;

  @Column({ type: 'int', unsigned: false })
  entityId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @Column({ length: 80, nullable: true })
  note: string | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  //? -------------------------------------------------------------------------/
  //? many-to-one belongsTo

  @ManyToOne(() => User, (user) => user.flags, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user?: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Flag>) {
    Object.assign(this, partial);
  }
}
