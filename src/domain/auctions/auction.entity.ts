import { Exclude } from 'class-transformer';
import { AuctionStatus } from 'src/common/enums';
import { Article } from 'src/domain/articles/article.entity';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { Bid } from 'src/domain/bids/bid.entity';
import { Order } from 'src/domain/orders/order.entity';
import { Pack } from 'src/domain/packs/pack.entity';
import { Post } from 'src/domain/posts/post.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 옥션 아이템; 작품이 존재해야만 옥션 아이템을 생성할 수 있음.
export class Auction extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  title: string;

  @Column({ length: 255 })
  subtitle: string;

  @Column('json', { nullable: true })
  images: string[] | null;

  @Column({ length: 8 })
  weeks: string;

  @Column({ type: 'datetime', precision: 6 })
  startTime: Date;

  @Column({ type: 'datetime', precision: 6 })
  endTime: Date;

  @Column({ type: 'datetime', precision: 6 })
  closingTime: Date;

  @Column({ type: 'int', default: 3 })
  bidExtMins: number;

  @Column({ type: 'int', default: 0 })
  estimate: number;

  @Column({ type: 'int', default: 0 })
  startingPrice: number;

  @Column({ type: 'int', default: 0 })
  reservePrice: number;

  @Column({ type: 'int', default: 0 })
  buyItNowPrice: number;

  @Column({ type: 'int', default: 10000 })
  bidIncrement: number;

  @Column({ type: 'int', default: 10000 })
  deliveryFee: number;

  @Column({ type: 'int', default: 0 })
  bidCount: number; //* aggregation 후 state 변경 필요

  @Column({ type: 'int', default: 0 })
  lastBidAmount: number; //* aggregation 후 state 변경 필요

  @Column({ type: 'int', unsigned: true, nullable: true })
  lastBidderId: number | null;

  @Column({ default: false })
  isPrivate: boolean; //* 히스토리 리스트에서 가격표시여부

  @Index()
  @Column({
    type: 'enum',
    enum: AuctionStatus,
    default: AuctionStatus.PREPARING,
  })
  status: AuctionStatus;

  @Exclude()
  @Column({ length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Order, (order) => order.auction, {
    cascade: ['insert', 'update'],
  })
  order?: Order | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Bid, (bid) => bid.auction, {
    // cascade: ['insert', 'update'],
  })
  bids: Bid[];

  @OneToMany(() => Post, (post) => post.auction, {
    // cascade: ['insert', 'update'],
  })
  posts: Post[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo
  //** keep it mind that whenever you want to start a new auction,
  //** you need to create a brand new one w/ a clean bidding history

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  artworkId: number | null; // to make it available to Repository.
  @ManyToOne(() => Artwork, (artwork) => artwork.auctions, {
    eager: true,
    onDelete: 'SET NULL',
  })
  artwork: Artwork;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Pack, (pack) => pack.auctions)
  packs: Pack[];

  @ManyToMany(() => User, (user) => user.favoriteAuctions)
  @JoinTable({ name: 'auction_user_alarm' }) // owning side
  users: User[];

  @ManyToMany(() => Article, (article) => article.auctions)
  articles: Article[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Auction>) {
  //   Object.assign(this, partial);
  // }
}
