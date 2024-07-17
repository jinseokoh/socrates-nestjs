import { ApiProperty } from '@nestjs/swagger';
import { ReportFeed } from 'src/domain/feeds/entities/report_feed.entity';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { Bookmark } from 'src/domain/feeds/entities/bookmark.entity';
import { Comment } from 'src/domain/feeds/entities/comment.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
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
@Unique('user_id_dot_id_key', ['userId', 'dotId'])
export class Post {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'feed 내용' })
  body: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count' })
  bookmarkCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'report count' })
  reportCount: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //*-------------------------------------------------------------------------*/
  //* 1-to-many hasMany

  @OneToMany(() => Comment, (comment) => comment.feed)
  public comments: Comment[];

  @OneToMany(() => ReportFeed, (ReportFeed) => ReportFeed.feed)
  public userReports: ReportFeed[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.feed)
  public usersBookmarked: Bookmark[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @ManyToOne(() => User, (user) => user.feeds)
  public user: User;

  @Column({ type: 'int', unsigned: true })
  public dotId: number;

  @ManyToOne(() => Dot, (dot) => dot.feeds)
  public dot: Dot;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  // //! 이 정보는 meetup 이 삭제되더라도 지우지 않고 유지 하기로
  // @ManyToMany(() => Career, (career) => career.meetups)
  // @JoinTable({ name: 'meetup_career' }) // owning side
  // careers: Career[];

  @ManyToMany(() => Inquiry, (inquiry) => inquiry.flaggedFeeds)
  flaggedInquiries: Inquiry[];

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Feed>) {
    Object.assign(this, partial);
  }
}
