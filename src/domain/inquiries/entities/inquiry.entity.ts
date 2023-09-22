import { Exclude } from 'class-transformer';
import { InquiryType } from 'src/common/enums/inquiry-type';
import { User } from 'src/domain/users/entities/user.entity';
import { Comment } from 'src/domain/comments/entities/comment.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Inquiry {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '제목' })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '내용' })
  body: string | null;

  @Column('json', { nullable: true }) // from Artwork
  @ApiProperty({ description: 'images' })
  images: string[] | null;

  @Column({ type: 'enum', enum: InquiryType, default: InquiryType.GENERAL })
  questionType: InquiryType;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

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
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.inquiries, {
    onDelete: 'SET NULL',
  })
  user: User;

  //*-------------------------------------------------------------------------*/
  //* 1-to-many hasMany

  @OneToMany(() => Comment, (comment) => comment.question, {
    // cascade: ['insert', 'update'],
  })
  comments: Comment[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Inquiry>) {
    Object.assign(this, partial);
  }
}
