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
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { ReportMeetup } from 'src/domain/meetups/entities/report_meetup.entity';
import { Career } from 'src/domain/careers/entities/career.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { Room } from 'src/domain/chats/entities/room.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';

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

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'join count' })
  joinCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'report count' })
  reportCount: number; // 신고

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ default: false })
  @ApiProperty({ description: 'has qa board?' })
  hasQa: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is full' })
  isFull: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is flagged' })
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

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

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

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany using one-to-many

  @OneToMany(() => Thread, (thread) => thread.meetup)
  public threads: Thread[];

  @OneToMany(() => Room, (room) => room.meetup)
  public rooms: Room[];

  @OneToMany(() => Join, (join) => join.meetup)
  public joins: Join[];

  @OneToMany(() => Like, (like) => like.meetup)
  public usersLiked: Like[];

  @OneToMany(() => ReportMeetup, (reportMeetup) => reportMeetup.meetup)
  public userReports: ReportMeetup[];

  //**------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  //! 이 정보는 meetup 이 삭제되더라도 지우지 않고 유지 하기로
  @ManyToMany(() => Career, (career) => career.meetups)
  @JoinTable({ name: 'meetup_career' }) // owning side
  careers: Career[];

  //! 이 정보는 meetup 이 삭제되더라도 지우지 않고 유지 하기로
  @ManyToMany(() => Category, (category) => category.meetups)
  @JoinTable({ name: 'meetup_category' }) // owning side
  categories: Category[];

  @ManyToMany(() => Inquiry, (inquiry) => inquiry.flaggedMeetups, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  flaggedInquiries: Inquiry[];

  //?-------------------------------------------------------------------------*/
  //? constructor

  constructor(partial: Partial<Meetup>) {
    Object.assign(this, partial);
  }
}
