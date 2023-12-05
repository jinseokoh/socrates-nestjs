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
  UpdateDateColumn,
} from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Connection {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public dotId: number;

  @Column({ type: 'text', nullable: false })
  @ApiProperty({ description: '사용자 답변' })
  body: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  likes: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  dislikes: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  nsfws: number;

  @Index('created-at-index')
  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ description: 'deletedAt' })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.connectedDots)
  public user: User;

  @ManyToOne(() => Dot, (dot) => dot.connectedUsers)
  public dot: Dot;
}
