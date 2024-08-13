import { Room } from 'src/domain/chats/entities/room.entity';
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
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { FeedComment } from 'src/domain/feeds/entities/feed_comment.entity';
import { Poll } from 'src/domain/icebreakers/entities/poll.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { Plea } from 'src/domain/icebreakers/entities/plea.entity';
import { Withdrawal } from 'src/domain/users/entities/widthdrawal.entity';
import { BookmarkUserFeed } from 'src/domain/users/entities/bookmark_user_feed.entity';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { BookmarkUserUser } from 'src/domain/users/entities/bookmark_user_user.entity';
import { MeetupComment } from 'src/domain/meetups/entities/meetup_comment.entity';
import { ContentComment } from 'src/domain/contents/entities/content_comment.entity';
import { Participant } from 'src/domain/chats/entities/participant.entity';
import { Question } from 'src/domain/icebreakers/entities/question.entity';
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

  //? ----------------------------------------------------------------------- //
  //? 1-to-1 hasOne

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
  })
  profile: Profile;

  //? ----------------------------------------------------------------------- //
  //? 1-to-many hasMany

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.user)
  public withdrawals: Withdrawal[];

  @OneToMany(() => Ledger, (ledger) => ledger.user, {
    // cascade: ['insert', 'update'],
  })
  public ledgers: Ledger[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  public providers: Provider[];

  @OneToMany(() => Poll, (poll) => poll.user, {
    // cascade: ['insert', 'update'],
  })
  public polls: Poll[];

  @OneToMany(() => Meetup, (meetup) => meetup.user, {
    // cascade: ['insert', 'update'],
  })
  public meetups: Meetup[];

  @OneToMany(() => Feed, (feed) => feed.user, {
    // cascade: ['insert', 'update'],
  })
  public feeds: Feed[];

  @OneToMany(() => Question, (question) => question.user, {
    // cascade: ['insert', 'update'],
  })
  public questions: Question[];

  @OneToMany(() => Inquiry, (inquiry) => inquiry.user, {
    // cascade: ['insert', 'update'],
  })
  public inquiries: Inquiry[];

  @OneToMany(() => MeetupComment, (comment) => comment.user)
  public meetupComments: MeetupComment[];

  @OneToMany(() => FeedComment, (comment) => comment.user)
  public feedComments: FeedComment[];

  @OneToMany(() => InquiryComment, (comment) => comment.user)
  public inquiryComments: InquiryComment[];

  @OneToMany(() => ContentComment, (comment) => comment.user)
  public contentComments: ContentComment[];

  //? ----------------------------------------------------------------------- //
  //? many-to-many belongsToMany using one-to-many

  @OneToMany(() => Join, (join) => join.user)
  public sentJoins: Join[];
  @OneToMany(() => Join, (join) => join.recipient)
  public receivedJoins: Join[];

  @OneToMany(() => Hate, (hate) => hate.user)
  public sentBans: Hate[];
  @OneToMany(() => Hate, (hate) => hate.recipient)
  public receivedBans: Hate[];

  @OneToMany(() => Friendship, (friendship) => friendship.user)
  public sentFriendships: Friendship[];
  @OneToMany(() => Friendship, (friendship) => friendship.recipient)
  public receivedFriendships: Friendship[];

  @OneToMany(() => Plea, (plea) => plea.user)
  public sentPleas: Plea[];
  @OneToMany(() => Plea, (plea) => plea.recipient)
  public receivedPleas: Plea[];

  @OneToMany(() => Impression, (impression) => impression.user)
  public sentImpressions: Impression[];
  @OneToMany(() => Impression, (impression) => impression.recipient)
  public receivedImpressions: Impression[];

  @OneToMany(() => Interest, (interest) => interest.user)
  public categoriesInterested: Interest[];

  @OneToMany(() => LanguageSkill, (languageSkill) => languageSkill.user)
  public languageSkills: LanguageSkill[];

  @OneToMany(() => Participant, (participant) => participant.user)
  public participants: Participant[];

  // bookmarks -------------------------------------------------------------- //

  @OneToMany(() => BookmarkUserFeed, (bookmark) => bookmark.user)
  public feedBookmarks: BookmarkUserFeed[];

  @OneToMany(() => BookmarkUserMeetup, (bookmark) => bookmark.user)
  public meetupBookmarks: BookmarkUserMeetup[];

  @OneToMany(() => BookmarkUserUser, (bookmark) => bookmark.user)
  public followings: BookmarkUserUser[];

  @OneToMany(() => BookmarkUserUser, (bookmark) => bookmark.recipient)
  public followers: BookmarkUserUser[];

  @OneToMany(() => Flag, (flag) => flag.user)
  public flags: Flag[];

  // @OneToMany(() => Flag, (flag) => flag.recipient)
  // public flaggedByUsers: Flag[];

  //? ----------------------------------------------------------------------- //
  //* many-to-many belongsToMany

  // @ManyToMany(() => Region, (region) => region.meetups)
  // @JoinTable({ name: 'meetup_region' }) // owning side
  // regions: Region[];

  //? ----------------------------------------------------------------------- //
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
