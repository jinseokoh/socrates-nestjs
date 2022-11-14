import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/user.entity';
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
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: true })
  bio: string | null;

  @Column({ default: true })
  notifyPush: boolean;

  @Column({ default: true })
  notifyKakao: boolean;

  @Column({ default: true })
  notifyEmail: boolean;

  @Column({ default: true })
  notifyEvent: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  payCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Profile>) {
  //   Object.assign(this, partial);
  // }
}
