import { Exclude } from 'class-transformer';
import { Answer } from 'src/domain/answers/entities/answer.entity';
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
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';

@Entity()
export class Question {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
  body: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ default: false })
  @ApiProperty({ description: '신고여부' })
  isFlagged: boolean;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '모임장이 언제 읽었는지' })
  readAt: Date | null;

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

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  meetupId: number | null; // to make it available to Repository.

  @ManyToOne(() => Meetup, (meetup) => meetup.questions, {
    onDelete: 'SET NULL',
  })
  meetup: Meetup;

  //*-------------------------------------------------------------------------*/
  //* 1-to-many hasMany

  @OneToMany(() => Answer, (answer) => answer.question, {
    // cascade: ['insert', 'update'],
  })
  answers: Answer[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Question>) {
    Object.assign(this, partial);
  }
}
