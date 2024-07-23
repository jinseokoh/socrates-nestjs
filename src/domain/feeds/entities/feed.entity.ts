import { ApiProperty } from '@nestjs/swagger';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsArray } from 'class-validator';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { FeedFeedLink } from 'src/domain/feeds/entities/feed_feed_link.entity';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Feed {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ length: 64, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: false })
  @ApiProperty({ description: 'feed 내용' })
  body: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지' })
  @IsArray()
  images: string[] | null;

  // like, comment, view, bookmark, flag count ------------------------------ //
  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'views' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count' })
  bookmarkCount: number;

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

  //* ----------------------------------------------------------------------- */
  //* 1-to-1 hasOne

  @OneToOne(() => Poll, (poll) => poll.feed, {
    cascade: ['insert', 'update'],
  })
  poll: Poll;

  //* ----------------------------------------------------------------------- */
  //* 1-to-many (hasMany)

  @OneToMany(() => FeedFeedLink, (link) => link.feed)
  public feedLinks: FeedFeedLink[];

  @OneToMany(() => FeedFeedLink, (link) => link.linkedFeed)
  public linkedByFeeds: FeedFeedLink[];

  @OneToMany(() => FeedComment, (comment) => comment.feed)
  comments: FeedComment[];

  @OneToMany(() => Plea, (plea) => plea.feed)
  public pleas: Plea[];

  @OneToMany(() => BookmarkUserFeed, (bookmark) => bookmark.feed)
  public bookmarkedByUsers: BookmarkUserFeed[];

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

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Feed>) {
    Object.assign(this, partial);
  }
}
