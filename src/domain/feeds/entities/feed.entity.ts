import { ApiProperty } from '@nestjs/swagger';
import { ReportUserFeed } from 'src/domain/users/entities/report_user_feed.entity';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
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
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsArray } from 'class-validator';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { BookmarkUserFeed } from 'src/domain/users/entities/user_feed_bookmark.entity';
import { FeedFeedLink } from 'src/domain/feeds/entities/feed_feed_link.entity';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Feed {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'feed 내용' })
  body: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '작품이미지' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'views' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

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
  //* 1-to-1 hasOne

  @OneToOne(() => Poll, (poll) => poll.feed, {
    cascade: ['insert', 'update'],
  })
  poll: Poll;

  //*-------------------------------------------------------------------------*/
  //* 1-to-many (hasMany)

  @OneToMany(() => FeedFeedLink, (link) => link.feed)
  public feedLinks: FeedFeedLink[];

  @OneToMany(() => FeedFeedLink, (link) => link.linkedFeed)
  public linkedByFeeds: FeedFeedLink[];

  @OneToMany(() => Comment, (comment) => comment.feed)
  comments: Comment[];

  @OneToMany(() => Plea, (plea) => plea.feed)
  public pleas: Plea[];

  @OneToMany(() => BookmarkUserFeed, (bookmark) => bookmark.feed)
  public bookmarkedByUsers: BookmarkUserFeed[];

  @OneToMany(() => ReportUserFeed, (report) => report.feed)
  public reportedByUsers: ReportUserFeed[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 (belongsTo)

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @ManyToOne(() => User, (user) => user.feeds)
  public user: User;

  //**--------------------------------------------------------------------------*/
  //** many-to-many (belongsToMany)

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
