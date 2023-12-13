import { ApiProperty } from '@nestjs/swagger';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_dot_id_key', ['userId', 'dotId'])
export class Connection {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'text', nullable: false })
  @ApiProperty({ description: '사용자 답변' })
  body: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  likes: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  dislikes: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  nsfws: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @ManyToOne(() => User, (user) => user.connectedDots)
  public user: User;

  @Column({ type: 'int', unsigned: true })
  public dotId: number;

  @ManyToOne(() => Dot, (dot) => dot.connectedUsers)
  public dot: Dot;
}
