import { ApiProperty } from '@nestjs/swagger';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
import { Reaction } from 'src/domain/icebreakers/entities/reaction.entity';
import { AnswerComment } from 'src/domain/icebreakers/entities/answer_comment.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { IsArray } from 'class-validator';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_question_id_key', ['userId', 'questionId'])
export class Answer {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: '객관식 답변' })
  @IsArray()
  choices: number[] | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '주관식 답변' })
  answer: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지들' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  answer_commentCount: number; // 댓글

  @Column({ type: 'int', unsigned: true, default: 0 })
  reportCount: number; // 신고

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'sympathyCount' })
  sympathyCount: number; // 감정) reaction #1

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'smileCount' })
  smileCount: number; // 감정) reaction #2

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'surpriseCount' })
  surpriseCount: number; // 감정) reaction #3

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'sorryCount' })
  sorryCount: number; // 감정) reaction #4

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'uneasyCount' })
  uneasyCount: number; // 감정) reaction #5

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //? ----------------------------------------------------------------------- //
  //? 1-to-many hasMany

  @OneToMany(() => AnswerComment, (comment) => comment.answer)
  comments: AnswerComment[];

  @OneToMany(() => Reaction, (reaction) => reaction.answer)
  public userReactions: Reaction[];

  //? ----------------------------------------------------------------------- //
  //? many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @ManyToOne(() => User, (user) => user.answers)
  public user: User;

  @Column({ type: 'int', unsigned: true })
  public questionId: number;

  @ManyToOne(() => Question, (question) => question.answers)
  public question: Question;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Answer>) {
    Object.assign(this, partial);
  }
}
