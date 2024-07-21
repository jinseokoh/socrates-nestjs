import { ApiProperty } from '@nestjs/swagger';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
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

  @Column({ length: 80, nullable: true })
  message: string | null;

  @Column({ length: 80, nullable: true })
  note: string | null;

  @Column({ length: 32, nullable: false })
  entityType: string;

  @Column({ type: 'int', unsigned: false })
  entityId: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ description: 'deletedAt' })
  deletedAt: Date | null;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

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
