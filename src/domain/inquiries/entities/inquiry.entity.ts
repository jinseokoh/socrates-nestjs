import { Exclude } from 'class-transformer';
import { InquiryType } from 'src/common/enums/inquiry-type';
import { User } from 'src/domain/users/entities/user.entity';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
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
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: InquiryType, default: InquiryType.GENERAL })
  inquiryType: InquiryType;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '제목' })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '내용' })
  body: string | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'images' })
  images: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;
  
  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count' })
  bookmarkCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //? ----------------------------------------------------------------------- //
  //* 1-to-many hasMany

  @OneToMany(() => InquiryComment, (comment) => comment.inquiry, {
    // cascade: ['insert', 'update'],
  })
  comments: InquiryComment[];

  //? ----------------------------------------------------------------------- //
  //? many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.inquiries)
  user: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Inquiry>) {
    Object.assign(this, partial);
  }
}
