import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { RoleEnum } from 'src/common/enums';
import { GenderEnum } from 'src/common/enums/gender';
import { MeetupUser } from 'src/domain/meetups/entities/meetup-user.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 32, unique: true, nullable: true })
  @ApiProperty({ description: 'username' })
  username: string | null;

  @Column({ length: 32, unique: true, nullable: true })
  @ApiProperty({ description: 'phone' })
  phone: string | null;

  @Column({ length: 64, unique: true })
  @ApiProperty({ description: 'email' })
  email: string;

  @Exclude()
  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'password' })
  password: string | null;

  @Column({ length: 32, nullable: true })
  @ApiProperty({ description: 'realname' })
  realname: string | null;

  @Column({ type: 'enum', enum: GenderEnum, nullable: true })
  @ApiProperty({ description: '성별' })
  gender: GenderEnum | null;

  @Exclude()
  @Column({ nullable: true })
  @ApiProperty({ description: 'dob' })
  dob: Date;

  @Column({
    length: 255,
    nullable: true,
    default: 'https://cdn.fleaauction.world/images/user.png',
  })
  @ApiProperty({ description: 'avatar' })
  avatar: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: 'pushToken' })
  pushToken: string | null;

  @Exclude()
  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'refreshTokenHash' })
  refreshTokenHash: string | null;

  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.USER })
  @ApiProperty({ description: 'role' })
  role: RoleEnum;

  @Column({ default: false })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'isBanned' })
  isBanned: boolean;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'usernamedAt' })
  usernamedAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ description: 'deletedAt' })
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
  })
  profile: Profile;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  // @OneToMany(() => Bookmark, (bookmark) => bookmark.user, {
  //   // cascade: ['insert', 'update'],
  // })
  // bookmarks: Bookmark[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  providers: Provider[];

  @OneToMany(() => Meetup, (meetup) => meetup.user, {
    // cascade: ['insert', 'update'],
  })
  meetups: Meetup[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many

  @OneToMany(() => MeetupUser, (meetupUser) => meetupUser.user)
  public meetupUsers!: MeetupUser[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  @Expose()
  get age(): number | null {
    if (this.dob === null) return null;
    const today = new Date().getTime();
    const birth = new Date(this.dob).getTime();
    return Math.floor((today - birth) / 3.15576e10);
  }
}
