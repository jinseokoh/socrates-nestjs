import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Gender, Role, Career } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportMeetup } from 'src/domain/meetups/entities/report_meetup.entity';
import { Like } from 'src/domain/meetups/entities/like.entity';
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Comment } from 'src/domain/inquiries/entities/comment.entity';
import { ReportUser } from 'src/domain/users/entities/report_user.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { Impression } from 'src/domain/users/entities/impression.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { Thread } from 'src/domain/meetups/entities/thread.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Room } from 'src/domain/chats/entities/room.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Remark } from 'src/domain/connections/entities/remark.entity';
import { Dot } from 'src/domain/connections/entities/dot.entity';
import { ReportConnection } from 'src/domain/connections/entities/report_connection.entity';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Plea } from 'src/domain/users/entities/plea.entity';
@Entity()
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

  @OneToMany(() => Ledger, (ledger) => ledger.user, {
    // cascade: ['insert', 'update'],
  })
  ledgers: Ledger[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.user, {
    // cascade: ['insert', 'update'],
  })
  inquiries: Inquiry[];

  @OneToMany(() => Thread, (thread) => thread.user, {
    // cascade: ['insert', 'update'],
  })
  threads: Thread[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  providers: Provider[];

  @OneToMany(() => Meetup, (meetup) => meetup.user, {
    // cascade: ['insert', 'update'],
  })
  meetups: Meetup[];

  @OneToMany(() => Dot, (dot) => dot.user, {
    // cascade: ['insert', 'update'],
  })
  dots: Dot[];

  @OneToMany(() => Connection, (connection) => connection.user)
  public connections: Connection[];

  @OneToMany(() => Comment, (comment) => comment.user)
  public comments: Comment[];

  @OneToMany(() => Remark, (remark) => remark.user)
  public remarks: Remark[];

  @OneToMany(() => Impression, (impression) => impression.user)
  public impressions: Impression[];

  @OneToMany(() => Flag, (flag) => flag.user)
  public flags: Flag[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => Join, (join) => join.askingUser)
  public askingJoins: Join[];

  @OneToMany(() => Join, (join) => join.askedUser)
  public askedJoins: Join[];

  @OneToMany(() => ReportUser, (reportUser) => reportUser.user)
  public accusingReports: ReportUser[];

  @OneToMany(() => ReportUser, (reportUser) => reportUser.accusedUser)
  public accusedReports: ReportUser[];

  @OneToMany(() => Hate, (hate) => hate.sender)
  public usersHating: Hate[];

  @OneToMany(() => Hate, (hate) => hate.recipient)
  public usersHated: Hate[];

  @OneToMany(() => Plea, (plea) => plea.sender)
  public sentPleas: Plea[];

  @OneToMany(() => Plea, (plea) => plea.recipient)
  public receivedPleas: Plea[];

  @OneToMany(() => Friendship, (friendship) => friendship.sender)
  public sentFriendships: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.recipient)
  public receivedFriendships: Friendship[];

  @OneToMany(() => Room, (room) => room.user)
  public rooms: Room[];

  @OneToMany(() => Like, (like) => like.user)
  public meetupsLiked: Like[];

  @OneToMany(() => ReportMeetup, (reportMeetup) => reportMeetup.user)
  public meetupReports: ReportMeetup[];

  @OneToMany(() => Interest, (interest) => interest.user)
  public categoriesInterested: Interest[];

  @OneToMany(() => Connection, (connection) => connection.user)
  public connectionsReacted: Reaction[];

  @OneToMany(
    () => ReportConnection,
    (reportConnection) => reportConnection.user,
  )
  public connectionsReported: ReportConnection[];

  @OneToMany(() => LanguageSkill, (languageSkill) => languageSkill.user)
  public languageSkills: LanguageSkill[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany

  // @ManyToMany(() => Region, (region) => region.meetups)
  // @JoinTable({ name: 'meetup_region' }) // owning side
  // regions: Region[];

  @ManyToMany(() => Inquiry, (inquiry) => inquiry.flaggedUsers)
  flaggedInquiries: Inquiry[];

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
