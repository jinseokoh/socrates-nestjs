import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsArray } from 'class-validator';
import { SubCategory } from 'src/common/enums';
import { Keyword } from 'src/common/enums/keyword';
import { User } from 'src/domain/users/entities/user.entity';
import {
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

  @Column({ length: 255, nullable: true })
  bio: string | null;

  @Column({ length: 4, nullable: true })
  mbti: string | null;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: '지역' })
  region: string | null;

  @Column({ length: 16, nullable: true })
  @ApiProperty({ description: '직업' })
  occupation: string | null;

  @Column({ length: 16, nullable: true })
  @ApiProperty({ description: '학력' })
  education: string | null;

  @Column({ default: true })
  notifyPush: boolean;

  @Column({ default: true })
  notifyEmail: boolean;

  @Column({ default: true })
  notifyKakao: boolean;

  // @Column({
  //   type: 'set',
  //   enum: SubCategory,
  //   default: [],
  // })
  // @ApiProperty({ description: 'comma separated interest list' })
  // interests: SubCategory[];

  @Column('json', { nullable: true })
  @ApiProperty({ description: '첫인상 평균' })
  @IsArray()
  impressions: string[] | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'FYI in Korean' })
  @IsArray()
  fyis: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  postCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  joinCount: number;

  @Exclude()
  @Column({ type: 'int', unsigned: true, default: 0 })
  payCount: number;

  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Profile>) {
    Object.assign(this, partial);
  }
}
