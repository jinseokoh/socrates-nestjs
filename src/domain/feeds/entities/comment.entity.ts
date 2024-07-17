import { User } from 'src/domain/users/entities/user.entity';

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Feed } from 'src/domain/feeds/entities/feed.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255 })
  @ApiProperty({ description: '내용' })
  body: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '1달 동안만 사용가능' })
  expiredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.remarks, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'int', unsigned: true })
  feedId: number; // to make it available to Repository.

  @ManyToOne(() => Feed, (feed) => feed.remarks, {
    onDelete: 'CASCADE',
  })
  feed: Feed;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/threads/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => Remark, (remark) => remark.parent)
  children: Remark[];

  @ManyToOne(() => Remark, (Remark) => Remark.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Remark;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Remark>) {
    Object.assign(this, partial);
  }
}
