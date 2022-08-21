import { Exclude } from 'class-transformer';
import { Auction } from 'src/domain/auctions/auction.entity';
import { PostComment } from 'src/domain/post-comments/post-comment.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? Post; 앱에서 사용하는 콘텐츠 단위
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column('json', { nullable: true })
  images: string[] | null;

  @Column({ type: 'int', default: 0 })
  commentCount: number; //* aggregation 후 state 변경 필요

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  auctionId: number | null; // to make it available to Repository.
  @ManyToOne(() => Auction, (auction) => auction.posts, {
    onDelete: 'SET NULL',
  })
  auction: Auction;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => PostComment, (postComment) => postComment.post, {
    // cascade: ['insert', 'update'],
  })
  postComments: PostComment[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Post>) {
  //   Object.assign(this, partial);
  // }
}
