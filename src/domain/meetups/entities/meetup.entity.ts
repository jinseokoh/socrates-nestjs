import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import {
  Day,
  Expense,
  Region,
  Time,
  TargetCareer,
  Category as CategoryEnum,
  SubCategory,
  TargetGender,
  TargetCareerType,
} from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Venue } from 'src/domain/meetups/entities/venue.entity';
import { Career } from 'src/domain/careers/entities/career.entity';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
import { Room } from 'src/domain/chats/entities/room.entity';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';

@Entity()
export class Meetup {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: CategoryEnum, default: CategoryEnum.CHALLENGE })
  @ApiProperty({ description: 'category' })
  category: CategoryEnum;

  @Column({
    type: 'enum',
    enum: SubCategory,
    default: SubCategory.OTHER_LEISURE,
  })
  @ApiProperty({ description: 'subcategory' })
  subCategory: SubCategory;

  @Column({ length: 64 }) // from Auction
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '모임정보' })
  description: string | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지들' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'enum', enum: TargetGender, default: TargetGender.ALL })
  @ApiProperty({ description: 'gender looking for' })
  targetGender: TargetGender;

  @Column({ type: 'tinyint', unsigned: true, default: 18 })
  targetMinAge: number;

  @Column({ type: 'tinyint', unsigned: true, default: 66 })
  targetMaxAge: number;

  @Column({
    type: 'set',
    enum: TargetCareer,
    default: [TargetCareer.ALL],
  })
  @ApiProperty({ description: 'comma separated target career list' })
  targetCareers: TargetCareerType[];

  @Column({
    type: 'enum',
    enum: Region,
    default: Region.SEOUL,
  })
  @ApiProperty({ description: 'region' })
  region: Region;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: 'max # of participants' })
  max: number;

  @Column({ type: 'enum', enum: Day, default: Day.WEEKDAYS })
  @ApiProperty({ description: '요일' })
  day: Day;

  @Column({
    type: 'set',
    enum: Time,
    default: [],
  })
  @ApiProperty({ description: 'comma separated time list' })
  times: Time[];

  @Column({ type: 'int', unsigned: true })
  @ApiProperty({ description: '참가비' })
  amount: number;

  @Column({
    type: 'set',
    enum: Expense,
    default: [],
  })
  @ApiProperty({ description: 'comma separated expense hashtag' })
  expenses: Expense[];

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: 'patron level' })
  patron: number;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: 'skill level' })
  skill: number;

  // join, view bookmark, flag count  --------------------------------------- //
  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count = like count' })
  bookmarkCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'join count' })
  joinCount: number;

  @Column({ default: false })
  @ApiProperty({ description: 'has qa board?' })
  hasQa: boolean;

  @Column({ default: false })
  @ApiProperty({ description: '게스트가 모두 결정되었는지 여부' })
  isFull: boolean;

  @Column({ default: false })
  @ApiProperty({ description: '신고 여부' })
  isFlagged: boolean;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'expiration' })
  expiredAt: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'appointment' })
  appointedAt: Date | null;

  @Index('created-at-index')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //? ----------------------------------------------------------------------- //
  //? many-to-1 (belongsTo)

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.meetups, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user?: User;

  @Column({ type: 'int', unsigned: true })
  venueId: number; // to make it available to Repository.

  @ManyToOne(() => Venue, (venue) => venue.meetups, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  venue?: Venue;

  //? ----------------------------------------------------------------------- //
  //? 1-to-1 hasOne

  @OneToOne(() => Room, (room) => room.meetup)
  @JoinColumn({ name: 'roomId' })
  room?: Room | null;

  //? ----------------------------------------------------------------------- //
  //? many-to-many belongsToMany using one-to-many (hasMany)

  @OneToMany(() => MeetupComment, (meetupComment) => meetupComment.meetup)
  public meetupComments: MeetupComment[];

  @OneToMany(() => Join, (join) => join.meetup)
  public joins: Join[];

  @OneToMany(() => BookmarkUserMeetup, (bookmark) => bookmark.meetup)
  public bookmarkedByUsers: BookmarkUserMeetup[];

  //? ----------------------------------------------------------------------- //
  //? many-to-many (belongsToMany)

  //! 이 정보는 meetup 이 삭제되더라도 지우지 않고 유지 하기로
  @ManyToMany(() => Career, (career) => career.meetups)
  @JoinTable({ name: 'meetup_career' }) // owning side
  careers: Career[];

  //! 이 정보는 meetup 이 삭제되더라도 지우지 않고 유지 하기로
  @ManyToMany(() => Category, (category) => category.meetups)
  @JoinTable({ name: 'meetup_category' }) // owning side
  categories: Category[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Meetup>) {
    Object.assign(this, partial);
  }
}
