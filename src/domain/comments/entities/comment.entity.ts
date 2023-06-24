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

@Entity()
export class Comment {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255 })
  body: string;

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

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  questionId: number | null; // to make it available to Repository.

  @ManyToOne(() => Question, (question) => question.comments, {
    onDelete: 'SET NULL',
  })
  question: Question;

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
