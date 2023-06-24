import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Role } from 'src/common/enums';
import { Career } from 'src/common/enums/career';
import { Gender } from 'src/common/enums/gender';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Hate } from 'src/domain/meetups/entities/hate.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Match } from 'src/domain/meetups/entities/match.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Question } from 'src/domain/questions/entities/question.entity';
import { Comment } from 'src/domain/comments/entities/comment.entity';
import { Report } from 'src/domain/reports/entities/report.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

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

  @Column({ type: 'enum', enum: Gender, nullable: true })
  @ApiProperty({ description: '성별' })
  gender: Gender | null;

  @Column({ type: 'enum', enum: Career, nullable: true })
  @ApiProperty({ description: '직군' })
  career: Career | null;

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

  @Column({ length: 32, nullable: true })
  @ApiProperty({ description: 'deviceType' })
  deviceType: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: 'pushToken' })
  pushToken: string | null;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'refreshTokenHash' })
  refreshTokenHash: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  @ApiProperty({ description: 'role' })
  role: Role;

  @Column({ default: false })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'isBanned' })
  isBanned: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ description: 'deletedAt' })
  deletedAt: Date | null;

  //*-------------------------------------------------------------------------*/
  //* 1-to-1 hasOne

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
  })
  profile: Profile;

  //*-------------------------------------------------------------------------*/
  //* 1-to-many hasMany

  @OneToMany(() => Report, (report) => report.user, {
    // cascade: ['insert', 'update'],
  })
  reports: Report[];

  @OneToMany(() => Question, (question) => question.user, {
    // cascade: ['insert', 'update'],
  })
  questions: Question[];

  @OneToMany(() => Comment, (comment) => comment.user, {
    // cascade: ['insert', 'update'],
  })
  comments: Comment[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  providers: Provider[];

  @OneToMany(() => Meetup, (meetup) => meetup.user, {
    // cascade: ['insert', 'update'],
  })
  meetups: Meetup[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => Match, (match) => match.askingUser)
  public askingMatches: Match[];

  @OneToMany(() => Match, (match) => match.askedUser)
  public askedMatches: Match[];

  @OneToMany(() => Like, (like) => like.user)
  public meetupsLiked: Like[];

  @OneToMany(() => Hate, (hate) => hate.user)
  public meetupsHated: Hate[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany

  // @ManyToMany(() => Region, (region) => region.meetups)
  // @JoinTable({ name: 'meetup_region' }) // owning side
  // regions: Region[];

  @ManyToMany(() => Category, (category) => category.users)
  @JoinTable({ name: 'user_category' }) // owning side
  categories: Category[];

  //?-------------------------------------------------------------------------?/
  //? constructor

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
