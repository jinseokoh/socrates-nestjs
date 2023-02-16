import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsArray } from 'class-validator';
import { User } from 'src/domain/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자 프로파일 정보
export class Profile extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: true })
  bio: string | null;

  @Column({ length: 64, nullable: true })
  region: string | null;

  @Column({ length: 64, nullable: true })
  career: string | null;

  @Column({ default: true })
  notifyPush: boolean;

  @Column({ default: true })
  notifyEmail: boolean;

  @Column({ default: true })
  notifyKakao: boolean;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '관심키워드' })
  @IsArray()
  keywords: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  postCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  matchCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  payCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid', length: 36 })
  userId: string; // to make it available to Repository.

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Profile>) {
  //   Object.assign(this, partial);
  // }
}
