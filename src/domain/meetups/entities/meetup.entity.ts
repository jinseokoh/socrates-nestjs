import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from 'src/common/enums/category';
import { Expense } from 'src/common/enums/expense';
import { Gender } from 'src/common/enums/gender';
import { Time } from 'src/common/enums/time';
import { Bookmark } from 'src/domain/meetups/entities/bookmark.entity';
import { MeetupUser } from 'src/domain/meetups/entities/meetup-user.entity';
import { Region } from 'src/domain/meetups/entities/region.entity';
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
  UpdateDateColumn
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

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '이미지 URL' })
  image: string | null;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  max: number;

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.DINING,
  })
  @ApiProperty({ description: 'category' })
  category: Category;

  @Column({ type: 'enum', enum: Expense, default: Expense.BILLSONME })
  @ApiProperty({ description: '비용부담' })
  expense: Expense;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  @ApiProperty({ description: '원하는 성별' })
  gender?: Gender | null;

  @Column({ type: 'enum', enum: Time, nullable: true })
  @ApiProperty({ description: '시간대' })
  time: Time;

  @Column({ length: 64 }) // from Auction
  @ApiProperty({ description: '장소명' })
  venue?: string | null;

  @Column({ length: 128 }) // from Auction
  @ApiProperty({ description: '장소주소' })
  address?: string | null;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @ApiProperty({ description: '경도,위도' })
  geolocation?: string | null;

  @Column({ default: false })
  @ApiProperty({ description: '신고여부' })
  isFlagged: boolean;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'expiration' })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Bookmark, (bookmark) => bookmark.meetup, {
    // cascade: ['insert', 'update'],
  })
  bookmarks: Bookmark[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.meetups, {
    onDelete: 'CASCADE',
  })
  owner: User;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @OneToMany(() => MeetupUser, (meetupUser) => meetupUser.meetup)
  public meetupUsers!: MeetupUser[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Region, (region) => region.meetups)
  @JoinTable({ name: 'meetup_region' }) // owning side
  regions: Region[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Meetup>) {
  //   Object.assign(this, partial);
  // }
}
