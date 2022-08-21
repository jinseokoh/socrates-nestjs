import { Exclude } from 'class-transformer';
import { Role } from 'src/common/enums';
import { ArticleComment } from 'src/domain/article-comments/article-comment.entity';
import { Artist } from 'src/domain/artists/artist.entity';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Bid } from 'src/domain/bids/bid.entity';
import { Destination } from 'src/domain/destinations/destination.entity';
import { Grant } from 'src/domain/grants/grant.entity';
import { Order } from 'src/domain/orders/order.entity';
import { Payment } from 'src/domain/payments/payment.entity';
import { PostComment } from 'src/domain/post-comments/post-comment.entity';
import { Post } from 'src/domain/posts/post.entity';
import { Profile } from 'src/domain/profiles/profile.entity';
import { Provider } from 'src/domain/providers/provider.entity';
import { Question } from 'src/domain/questions/question.entity';
import {
  BaseEntity,
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
import { Follow } from '../follows/follow.entity';
@Entity() //? 사용자
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 32, unique: true, nullable: true })
  username: string | null;

  @Column({ length: 32, unique: true, nullable: true })
  phone: string | null;

  @Column({ length: 64, unique: true })
  email: string;

  @Exclude()
  @Column({ length: 64, nullable: true })
  password: string | null;

  @Column({ length: 32, nullable: true })
  realname: string | null;

  @Column({
    length: 255,
    nullable: true,
    default: 'https://cdn.fleaauction.world/images/user.png',
  })
  avatar: string | null;

  @Column({ length: 255, nullable: true })
  pushToken: string | null;

  @Exclude()
  @Column({ length: 64, nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ type: 'int', unsigned: true, default: 0 })
  score: number;

  @Column({ length: 2, default: 'ko' })
  locale: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  usernamedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
  })
  profile: Profile;
  @OneToOne(() => Artist, (artist) => artist.user)
  artist?: Artist | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Bid, (bid) => bid.user, {
    // cascade: ['insert', 'update'],
  })
  bids: Bid[];

  @OneToMany(() => Post, (post) => post.user, {
    // cascade: ['insert', 'update'],
  })
  posts: Post[];

  @OneToMany(() => Artwork, (artwork) => artwork.owner, {
    // cascade: ['insert', 'update'],
  })
  artworks: Artwork[];

  @OneToMany(() => Question, (question) => question.user, {
    // cascade: ['insert', 'update'],
  })
  questions: Question[];

  @OneToMany(() => ArticleComment, (articleComment) => articleComment.user, {
    // cascade: ['insert', 'update'],
  })
  articleComments: ArticleComment[];

  @OneToMany(() => PostComment, (postComment) => postComment.user, {
    // cascade: ['insert', 'update'],
  })
  postComments: PostComment[];

  @OneToMany(() => Destination, (destination) => destination.user, {
    // cascade: ['insert', 'update'],
  })
  destinations: Destination[];

  @OneToMany(() => Grant, (grant) => grant.user, {
    // cascade: ['insert', 'update'],
  })
  grants: Grant[];

  @OneToMany(() => Order, (order) => order.user, {
    // cascade: ['insert', 'update'],
  })
  orders: Order[];

  @OneToMany(() => Payment, (payment) => payment.user, {
    // cascade: ['insert', 'update'],
  })
  payments: Payment[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  providers: Provider[];

  @OneToMany(() => Follow, (follow) => follow.follower, {
    // cascade: ['insert', 'update'],
  })
  followers: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following, {
    // cascade: ['insert', 'update'],
  })
  followings: Follow[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many

  // !! `synchronize: true` 을 하는 경우, pivot 테이블의 custom fields 가 없어지므로,
  // !! 바로 아래 5줄의 설정은 valid 한 옵션이 아니다. 단, comment out 하여, follow 테이블을
  // !! 생성한 다음에는, `synchronize: false` 로 바구고 Laravel 처럼 query 하는 것이 가능하다.
  // !!
  // @ManyToMany(() => User, (user) => user.Following)
  // @JoinTable({ name: 'follow' })
  // Followers: User[];
  // @ManyToMany(() => User, (user) => user.Followers)
  // Following: User[];

  @ManyToMany(() => Auction, (auction) => auction.users)
  favoriteAuctions: Auction[]; // for alarms

  @ManyToMany(() => Artwork, (artwork) => artwork.users)
  favoriteArtworks: Artwork[]; // for likes

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<User>) {
  //   Object.assign(this, partial);
  // }
}
