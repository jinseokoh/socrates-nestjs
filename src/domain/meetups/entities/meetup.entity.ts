import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsArray } from 'class-validator';
import { Day, Expense, Gender, Region, Time } from 'src/common/enums';
import { Career } from 'src/common/enums/career';
import { Category as CategoryEnum } from 'src/common/enums/category';
import { SubCategory } from 'src/common/enums/subcategory';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Category } from 'src/domain/categories/entities/category.entity';
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

  @Column({ type: 'enum', enum: CategoryEnum, default: CategoryEnum.LEISURE })
  @ApiProperty({ description: 'category' })
  category: CategoryEnum;

  @Column({
    type: 'enum',
    enum: SubCategory,
    default: SubCategory.OTHER_LEISURE,
  })
  @ApiProperty({ description: 'subcategory' })
  subCategory: SubCategory;

  @Column({ type: 'enum', enum: Gender, default: null })
  @ApiProperty({ description: 'gender looking for' })
  gender: Gender | null;

  @Column({ type: 'enum', enum: Career, default: null })
  @ApiProperty({ description: 'career looking career' })
  career: Career | null;

  @Column({
    type: 'enum',
    enum: Region,
    default: Region.SEOUL,
  })
  @ApiProperty({ description: 'region' })
  region: Region;

  @Column({ type: 'enum', enum: Day, default: Day.WEEKDAYS })
  @ApiProperty({ description: '요일' })
  day: Day;

  @Column({ type: 'enum', enum: Time, default: Time.DINNER })
  @ApiProperty({ description: '시간대' })
  time: Time;

  @Column({ type: 'enum', enum: Expense, default: Expense.SPLIT_EVEN })
  @ApiProperty({ description: '비용부담' })
  expense: Expense;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: 'max # of participants' })
  max: number;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: 'patron level' })
  patron: number;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: 'skill level' })
  skill: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'match count' })
  matchCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'fave count' })
  faveCount: number;

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

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Venue, (venue) => venue.meetup, {
    // cascade: ['insert', 'update'],
  })
  venue?: Venue;

  // //**--------------------------------------------------------------------------*/
  // //** 1-to-many hasMany

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.meetup, {
  //   // cascade: ['insert', 'update'],
  // })
  // bookmarks: Bookmark[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.meetups, {
    onDelete: 'CASCADE',
  })
  user?: User;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @OneToMany(() => Match, (match) => match.meetup)
  public matches!: Match[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  // @ManyToMany(() => Region, (region) => region.meetups)
  // @JoinTable({ name: 'meetup_region' }) // owning side
  // regions: Region[];

  @ManyToMany(() => Category, (category) => category.meetups)
  @JoinTable({ name: 'meetup_category' }) // owning side
  categories: Category[];

  @ManyToMany(() => User, (user) => user.meetups)
  @JoinTable({ name: 'meetup_user' }) // owning side
  users: User[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Meetup>) {
  //   Object.assign(this, partial);
  // }
}
