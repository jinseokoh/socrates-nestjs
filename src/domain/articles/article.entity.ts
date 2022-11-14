import { ArticleCategory } from 'src/common/enums';
import { ArticleComment } from 'src/domain/article-comments/article-comment.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Banner } from 'src/domain/banners/banner.entity';
import { Pack } from 'src/domain/packs/pack.entity';
import {
  BaseEntity,
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
@Entity() //? 아티클; 앱에서 사용하는 콘텐츠 단위
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  title: string;

  @Column({ length: 255 })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column('json', { nullable: true })
  images: string[] | null;

  @Column({
    type: 'enum',
    enum: ArticleCategory,
    default: ArticleCategory.FLEA_AUCTION,
  })
  category: ArticleCategory;

  @Column({ type: 'int', unsigned: true, default: 0 })
  commentCount: number;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Banner, (banner) => banner.article, {
    cascade: ['insert', 'update'],
  })
  banner?: Banner | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => ArticleComment, (articleComment) => articleComment.article, {
    // cascade: ['insert', 'update'],
  })
  articleComments: ArticleComment[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Article)
  @JoinTable({ name: 'article_article' })
  relatedArticles: Article[];

  @ManyToMany(() => Auction, (auction) => auction.articles)
  @JoinTable({ name: 'article_auction' }) // owning side
  auctions: Auction[];

  @ManyToMany(() => Pack, (pack) => pack.articles)
  packs: Pack[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Article>) {
  //   Object.assign(this, partial);
  // }
}
