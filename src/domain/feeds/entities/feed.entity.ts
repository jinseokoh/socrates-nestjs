import { ApiProperty } from '@nestjs/swagger';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsArray } from 'class-validator';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Feed {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @Column({ length: 16, nullable: false })
  @ApiProperty({ description: 'slug' })
  slug: string;

  @Column({ length: 80, nullable: true })
  @ApiProperty({ description: '제목' })
  title: string | null;

  @Column({ type: 'text', nullable: false })
  @ApiProperty({ description: 'feed 내용' })
  body: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지' })
  @IsArray()
  images: string[] | null;

  @Column({ default: false })
  @ApiProperty({ description: 'is anonymous' })
  isAnonymous: boolean;

  // @Column({ type: 'enum', enum: TargetGender, default: TargetGender.ALL })
  // @ApiProperty({ description: 'gender looking for' })
  // targetGender: TargetGender;

  // @Column({ type: 'tinyint', unsigned: true, default: 18 })
  // targetMinAge: number;

  // @Column({ type: 'tinyint', unsigned: true, default: 66 })
  // targetMaxAge: number;

  // like, comment, view, bookmark, flag count ------------------------------ //
  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'views' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

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

  //? ----------------------------------------------------------------------- //
  //? many-to-1 (belongsTo)

  @ManyToOne(() => User, (user) => user.feeds)
  public user: User;

  //? ----------------------------------------------------------------------- //
  //? many-to-many belongsToMany using one-to-many (hasMany)

  @OneToMany(() => FeedComment, (comment) => comment.feed)
  public comments: FeedComment[];

  @OneToMany(() => BookmarkUserFeed, (bookmark) => bookmark.feed)
  public bookmarks: BookmarkUserFeed[];

  //? ----------------------------------------------------------------------- //
  //? many-to-many (belongsToMany)

  @ManyToMany(() => Poll, (poll) => poll.feeds)
  @JoinTable({ name: 'feed_poll' }) // owning side
  polls?: Poll[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Feed>) {
    Object.assign(this, partial);
  }
}
