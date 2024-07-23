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
export class InquiryComment {
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

  @ManyToOne(() => User, (user) => user.inquiryComments, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'int', unsigned: true })
  inquiryId: number; // to make it available to Repository.

  @ManyToOne(() => Inquiry, (inquiry) => inquiry.inquiryComments, {
    onDelete: 'CASCADE',
  })
  inquiry: Inquiry;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/threads/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => InquiryComment, (opinion) => opinion.parent)
  children: InquiryComment[];

  @ManyToOne(
    () => InquiryComment,
    (InquiryComment) => InquiryComment.children,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'parentId' })
  parent: InquiryComment;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<InquiryComment>) {
    Object.assign(this, partial);
  }
}
