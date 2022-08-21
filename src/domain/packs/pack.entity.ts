import { Article } from 'src/domain/articles/article.entity';
import { Artist } from 'src/domain/artists/artist.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 옥션 기획전; 시작일과 종료일을 공유하는 옥션상품들의 묶음 단위
export class Pack extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  title: string;

  @Column({ length: 255, nullable: true })
  summary: string | null;

  @Column('json', { nullable: true })
  images: string[] | null;

  @Column({ type: 'datetime', precision: 6 })
  startTime: Date;

  @Column({ type: 'datetime', precision: 6 })
  endTime: Date;

  @Column({ type: 'int', unsigned: true, default: 0 })
  closed: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  total: number;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Pack)
  @JoinTable({ name: 'pack_pack' })
  relatedPacks: Pack[];

  @ManyToMany(() => Artist, (artist) => artist.packs)
  @JoinTable({ name: 'pack_artist' }) // owning side
  artists: Artist[];

  @ManyToMany(() => Auction, (auction) => auction.packs)
  @JoinTable({ name: 'pack_auction' }) // owning side
  auctions: Auction[];

  @ManyToMany(() => Article, (article) => article.packs)
  @JoinTable({ name: 'pack_article' }) // owning side
  articles: Article[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Pack>) {
  //   Object.assign(this, partial);
  // }
}
