import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsArray } from 'class-validator';
import {
  DayEnum,
  ExpenseEnum,
  GenderEnum,
  RegionEnum,
  TimeEnum,
} from 'src/common/enums';
import { Category } from 'src/domain/categories/entities/category.entity';
import { MeetupUser } from 'src/domain/meetups/entities/meetup-user.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
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

@Entity() // 작품
export class Meetup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128 }) // from Auction
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 128, nullable: true }) // from Pack
  @ApiProperty({ description: 'subtitle' })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '모임정보' })
  body: string | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지들' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'enum', enum: GenderEnum, nullable: true })
  @ApiProperty({ description: 'gender looking for' })
  gender?: GenderEnum | null;

  @Column({
    type: 'enum',
    enum: RegionEnum,
    default: RegionEnum.SEOUL,
  })
  @ApiProperty({ description: 'region' })
  region: RegionEnum;

  @Column({ type: 'enum', enum: ExpenseEnum, default: ExpenseEnum.SPLIT_EVEN })
  @ApiProperty({ description: '비용부담' })
  expense: ExpenseEnum;

  @Column({ type: 'enum', enum: DayEnum, nullable: true })
  @ApiProperty({ description: '시간대' })
  day: DayEnum;

  @Column({ type: 'enum', enum: TimeEnum, nullable: true })
  @ApiProperty({ description: '시간대' })
  time: TimeEnum;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: '최대인원수' })
  max: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  matchCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  keepCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ default: false })
  @ApiProperty({ description: '신고여부' })
  isFlagged: boolean;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'expiration' })
  expiredAt: Date;

  @Index('created-at-index')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Venue, (venue) => venue.meetup, {
    // cascade: ['insert', 'update'],
  })
  venue: Venue;

  // //**--------------------------------------------------------------------------*/
  // //** 1-to-many hasMany

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.meetup, {
  //   // cascade: ['insert', 'update'],
  // })
  // bookmarks: Bookmark[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid', length: 36, nullable: true })
  userId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.meetups, {
    onDelete: 'CASCADE',
  })
  user: User;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @OneToMany(() => MeetupUser, (meetupUser) => meetupUser.meetup)
  public meetupUsers!: MeetupUser[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  // @ManyToMany(() => Region, (region) => region.meetups)
  // @JoinTable({ name: 'meetup_region' }) // owning side
  // regions: Region[];

  @ManyToMany(() => Category, (category) => category.meetups)
  @JoinTable({ name: 'meetup_category' }) // owning side
  categories: Category[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Meetup>) {
  //   Object.assign(this, partial);
  // }
}
