import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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
export class Like {
  // without primary column, it overwrites existing one with no exception
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository

  @Column({ length: 32, nullable: false })
  entityType: string;

  @Column({ type: 'int', unsigned: true })
  entityId: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  //? ----------------------------------------------------------------------- //
  //? many-to-one belongsTo

  @ManyToOne(() => User, (user) => user.likes, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Like>) {
    Object.assign(this, partial);
  }
}
