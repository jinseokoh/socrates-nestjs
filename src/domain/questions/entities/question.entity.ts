import { Exclude } from 'class-transformer';
import { QuestionType } from 'src/common/enums/question-type';
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
export class Question {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
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

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.GENERAL })
  questionType: QuestionType;

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

  @ManyToOne(() => User, (user) => user.questions, {
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

  constructor(partial: Partial<Question>) {
    Object.assign(this, partial);
  }
}
