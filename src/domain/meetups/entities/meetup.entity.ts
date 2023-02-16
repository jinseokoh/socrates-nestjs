import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CategoryEnum } from 'src/common/enums/category';
import { DayEnum } from 'src/common/enums/day';
import { ExpenseEnum } from 'src/common/enums/expense';
import { GenderEnum } from 'src/common/enums/gender';
import { TimeEnum } from 'src/common/enums/time';
import { Bookmark } from 'src/domain/bookmarks/entities/bookmark.entity';
import { Category } from 'src/domain/meetups/entities/category.entity';
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

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '이미지 URL' })
  image: string | null;

  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  max: number;

  @Column({
    type: 'enum',
    enum: CategoryEnum,
    default: CategoryEnum.DINING,
  })
  @ApiProperty({ description: 'category' })
  category: CategoryEnum;

  @Column({ type: 'enum', enum: ExpenseEnum, default: ExpenseEnum.SPLIT_EVEN })
  @ApiProperty({ description: '비용부담' })
  expense: ExpenseEnum;

  @Column({ type: 'enum', enum: GenderEnum, nullable: true })
  @ApiProperty({ description: '원하는 성별' })
  gender?: GenderEnum | null;

  @Column({ type: 'enum', enum: DayEnum, nullable: true })
  @ApiProperty({ description: '시간대' })
  day: DayEnum;

  @Column({ type: 'enum', enum: TimeEnum, nullable: true })
  @ApiProperty({ description: '시간대' })
  time: TimeEnum;

  @Column({ length: 64, nullable: true }) // from Auction
  @ApiProperty({ description: '장소명' })
  venue?: string | null;

  @Column({ length: 128, nullable: true }) // from Auction
  @ApiProperty({ description: '장소주소' })
  address?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  @ApiProperty({ description: '위도' })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  @ApiProperty({ description: '경도' })
  longitude: number | null;

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

  @ManyToMany(() => Region, (region) => region.meetups)
  @JoinTable({ name: 'meetup_region' }) // owning side
  regions: Region[];

  @ManyToMany(() => Category, (category) => category.meetups)
  @JoinTable({ name: 'meetup_category' }) // owning side
  categories: Category[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Meetup>) {
  //   Object.assign(this, partial);
  // }
}
