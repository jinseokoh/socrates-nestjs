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
import { Content } from 'src/domain/contents/entities/content.entity';

@Entity()
export class ContentComment {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true })
  contentId: number; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

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

  @ManyToOne(() => User, (user) => user.contentComments, { cascade: true })
  user: User;

  @ManyToOne(() => Content, (content) => content.comments, { cascade: true })
  content: Content;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/threads/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @ManyToOne(
    () => ContentComment,
    (ContentComment) => ContentComment.children,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'parentId' })
  parent: ContentComment;

  @OneToMany(() => ContentComment, (comment) => comment.parent)
  children: ContentComment[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<ContentComment>) {
    Object.assign(this, partial);
  }
}
