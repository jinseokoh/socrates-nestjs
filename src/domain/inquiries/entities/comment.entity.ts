import { Exclude } from 'class-transformer';
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
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';

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

  @Column({ default: false })
  @ApiProperty({ description: '신고여부' })
  isFlagged: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'int', unsigned: true })
  inquiryId: number; // to make it available to Repository.

  @ManyToOne(() => Inquiry, (inquiry) => inquiry.comments, {
    onDelete: 'CASCADE',
  })
  inquiry: Inquiry;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/questions/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];

  @ManyToOne(() => Comment, (comment) => comment.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Comment>) {
    Object.assign(this, partial);
  }
}
