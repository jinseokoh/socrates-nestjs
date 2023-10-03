import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsArray } from 'class-validator';
import {
  Day,
  Expense,
  Region,
  Time,
  Gender,
  Career as CareerEnum,
  Category as CategoryEnum,
  SubCategory,
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
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Dislike } from 'src/domain/meetups/entities/dislike.entity';
import { Career } from 'src/domain/careers/entities/career.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { Room } from 'src/domain/rooms/entities/room.entity';

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

  @Column({ type: 'enum', enum: Gender, default: Gender.ALL })
  @ApiProperty({ description: 'gender looking for' })
  targetGender: Gender;

  @Column({
    type: 'set',
    enum: CareerEnum,
    default: [CareerEnum.ALL],
  })
  @ApiProperty({ description: 'comma separated target career list' })
  targetCareers: CareerEnum[];

  @Column({ length: 8, nullable: true })
  @ApiProperty({ description: 'age range' })
  targetAge: string | null;

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
  @ApiProperty({ description: 'dislike count' })
  dislikeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ default: false })
  @ApiProperty({ description: 'has qa board?' })
  hasQa: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is pro meetup?' })
  isPro: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is full' })
  isFull: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is flagged' })
  isFlagged: boolean;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'expiration' })
  expiredAt: Date;

  @Index('created-at-index')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Venue, (venue) => venue.meetup, {
    // cascade: ['insert', 'update'],
  })
  venue?: Venue;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.meetups, {
    onDelete: 'CASCADE',
  })
  user?: User;

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

  @OneToMany(() => Dislike, (dislike) => dislike.meetup)
  public usersDisliked: Dislike[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Career, (career) => career.meetups)
  @JoinTable({ name: 'meetup_career' }) // owning side
  careers: Career[];

  @ManyToMany(() => Category, (category) => category.meetups)
  @JoinTable({ name: 'meetup_category' }) // owning side
  categories: Category[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Meetup>) {
    Object.assign(this, partial);
  }
}
