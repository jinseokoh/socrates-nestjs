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

@Entity()
export class Question {
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
