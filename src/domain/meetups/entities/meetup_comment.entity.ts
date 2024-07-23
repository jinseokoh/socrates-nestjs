import { Exclude } from 'class-transformer';
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
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';

@Entity()
export class MeetupComment {
  @PrimaryGeneratedColumn('increment', {
    type: 'int',
    unsigned: true,
  })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
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

  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.meetupComments, { cascade: true })
  user: User;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true, nullable: true })
  meetupId: number | null; // to make it available to Repository.

  @ManyToOne(() => Meetup, (meetup) => meetup.meetupComments, { cascade: true })
  meetup: Meetup;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/threads/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => MeetupComment, (thread) => thread.parent)
  children: MeetupComment[];

  @ManyToOne(() => MeetupComment, (MeetupComment) => MeetupComment.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: MeetupComment;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<MeetupComment>) {
    Object.assign(this, partial);
  }
}
