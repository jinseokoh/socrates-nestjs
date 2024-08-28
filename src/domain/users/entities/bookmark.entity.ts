import { ApiProperty } from '@nestjs/swagger';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

//? a User can bookmark Icebreaker
//? 모델사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_entity_type_entity_id_key', [
  'userId',
  'entityType',
  'entityId',
])
export class Bookmark {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository

  @Column({ length: 32, nullable: false })
  entityType: string;

  @Column({ type: 'int', unsigned: true })
  entityId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @Column({ length: 80, nullable: true })
  note: string | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.icebreakerBookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => Icebreaker, (icebreaker) => icebreaker.bookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public icebreaker: Icebreaker;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Bookmark>) {
    Object.assign(this, partial);
  }
}
