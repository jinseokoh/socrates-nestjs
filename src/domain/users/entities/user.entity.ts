import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Gender, Role } from 'src/common/enums';
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
import { Hate } from 'src/domain/users/entities/hate.entity';
import { Join } from 'src/domain/meetups/entities/join.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { Interest } from 'src/domain/users/entities/interest.entity';
import { Impression } from 'src/domain/users/entities/impression.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { InquiryComment } from 'src/domain/inquiries/entities/inquiry_comment.entity';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Room } from 'src/domain/chats/entities/room.entity';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { Poll } from 'src/domain/feeds/entities/poll.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { Withdrawal } from 'src/domain/users/entities/widthdrawal.entity';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { BookmarkUserUser } from 'src/domain/users/entities/bookmark_user_user.entity';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 32, unique: true, nullable: true })
  @ApiProperty({ description: 'username' })
  username: string | null;

  @Column({ length: 32, unique: true, nullable: true })
  @Exclude({ toPlainOnly: true })
  @ApiProperty({ description: 'phone' })
  phone: string | null;

  @Column({ length: 64, unique: true })
  @Exclude({ toPlainOnly: true })
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

  @Column({ nullable: true })
  @ApiProperty({ description: 'dob' })
  dob: Date;

  @Column({
    length: 255,
    nullable: true,
    default: 'https://cdn.mesoapp.kr/icons/user.png',
  })
  @ApiProperty({ description: 'avatar' })
  avatar: string | null;

  @Column({ length: 32, nullable: true })
  @ApiProperty({ description: 'deviceType' })
  deviceType: string | null;

  @Column({ length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  @ApiProperty({ description: 'pushToken' })
  pushToken: string | null;

  @Column({ length: 64, nullable: true })
  @Exclude({ toPlainOnly: true })
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

  /*-------------------------------------------------------------------------*/

  //* 1-to-many hasMany

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.user)
  withdrawals: Withdrawal[];

  @OneToMany(() => Ledger, (ledger) => ledger.user, {
    // cascade: ['insert', 'update'],
  })
  ledgers: Ledger[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  providers: Provider[];

  @OneToMany(() => Meetup, (meetup) => meetup.user, {
    // cascade: ['insert', 'update'],
  })
  meetups: Meetup[];

  @OneToMany(() => MeetupComment, (thread) => thread.user, {
    // cascade: ['insert', 'update'],
  })
  threads: MeetupComment[];

  @OneToMany(() => Feed, (feed) => feed.user, {
    // cascade: ['insert', 'update'],
  })
  feeds: Feed[];

  @OneToMany(() => Poll, (poll) => poll.user, {
    // cascade: ['insert', 'update'],
  })
  polls: Poll[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.user, {
    // cascade: ['insert', 'update'],
  })
  inquiries: Inquiry[];

  @OneToMany(() => FeedComment, (comment) => comment.user)
  public feedComments: FeedComment[];

  @OneToMany(() => InquiryComment, (comment) => comment.user)
  public inquiryComments: InquiryComment[];

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

  @OneToMany(() => Hate, (hate) => hate.user)
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

  @OneToMany(() => Interest, (interest) => interest.user)
  public categoriesInterested: Interest[];

  @OneToMany(() => LanguageSkill, (languageSkill) => languageSkill.user)
  public languageSkills: LanguageSkill[];

  // bookmarks -------------------------------------------------------------- //

  @OneToMany(() => BookmarkUserFeed, (bookmark) => bookmark.user)
  public feedBookmarks: BookmarkUserFeed[];

  @OneToMany(() => BookmarkUserMeetup, (bookmark) => bookmark.user)
  public meetupBookmarks: BookmarkUserMeetup[];

  @OneToMany(() => BookmarkUserUser, (bookmark) => bookmark.user)
  public userBookmarks: BookmarkUserUser[];

  @OneToMany(() => BookmarkUserUser, (bookmark) => bookmark.recipient)
  public bookmarkedByUsers: BookmarkUserUser[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany

  // @ManyToMany(() => Region, (region) => region.meetups)
  // @JoinTable({ name: 'meetup_region' }) // owning side
  // regions: Region[];

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
