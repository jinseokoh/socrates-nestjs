import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { BaseCareer } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Profile {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: '보유 코인수' })
  balance: number;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '소개글' })
  bio: string | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'height' })
  height: number;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: '지역' })
  region: string | null;

  @Column({ type: 'enum', enum: BaseCareer, nullable: true })
  @ApiProperty({ description: '직군' })
  career: BaseCareer | null;

  @Column({ length: 16, nullable: true })
  @ApiProperty({ description: '직업' })
  occupation: string | null;

  @Column({ length: 16, nullable: true })
  @ApiProperty({ description: '학력' })
  education: string | null;

  @Column({ length: 4, nullable: true })
  mbti: string | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'FYI in Korean' })
  @IsArray()
  fyis: string[] | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'images' })
  images: string[] | null;

  @Column({ type: 'json' })
  @ApiProperty({ description: 'notification options' })
  options: object;

  // join, pay, post, view, bookmark, flag count ---------------------------- //
  @Column({ type: 'int', unsigned: true, default: 0 })
  joinCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  payCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  postCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count' })
  bookmarkCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //* ------------------------------------------------------------------------- */
  //* 1-to-1 belongsTo

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User | null;

  //? ------------------------------------------------------------------------- */
  //? constructor

  constructor(partial: Partial<Profile>) {
    Object.assign(this, partial);
  }

  //? ------------------------------------------------------------------------- */
  //? program tically set a default using TypeORM hook

  @BeforeInsert()
  setDefaults() {
    this.options = this.options || {
      userBookmark: false, // 사용자 찜
      meetupBookmark: false, // 모임 찜
      meetupMeetupComment: false, // 모임 댓글
      meetupRequest: false, // 모임신청
      meetupRequestApproval: false, // 모임신청 승인
      meetupInviteApproval: false, // 모임초대 승인
      feedBookmark: false, // 발견 공감
      feedFeedComment: false, // 발견 댓글
      feedPlea: false, // 친구신청 발견글 요청
      feedPleaDenial: false, // 친구신청 발견글 요청
      friendRequest: false, // 친구 신청
      friendRequestApproval: false, // 친구신청 승인
      friendRequestDenial: false, // 친구신청 발견글 요청
      eventNotification: false,
    };
  }
}
