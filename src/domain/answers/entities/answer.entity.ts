import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/entities/user.entity';
import { Question } from 'src/domain/questions/entities/question.entity';

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

@Entity()
export class Answer {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
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
  @Column({ type: 'bigint', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.answers, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'bigint', unsigned: true })
  questionId: number; // to make it available to Repository.

  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
  })
  question: Question;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/questions/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Exclude()
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => Answer, (answer) => answer.parent)
  children: Answer[];

  @ManyToOne(() => Answer, (answer) => answer.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Answer;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Answer>) {
    Object.assign(this, partial);
  }
}
