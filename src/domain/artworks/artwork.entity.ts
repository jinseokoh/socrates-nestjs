import { Exclude } from 'class-transformer';
import {
  ArtworkCategory,
  Availability,
  Framing,
  Orientation,
  Size
} from 'src/common/enums';
import { Color } from 'src/common/enums/color';
import { Artist } from 'src/domain/artists/artist.entity';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Hashtag } from 'src/domain/hashtags/hashtag.entity';
import { User } from 'src/domain/users/user.entity';
import {
  AfterLoad,
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity() // 작품
export class Artwork extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  title: string;

  @Column({ length: 255, nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ length: 255, nullable: true })
  medium: string | null;

  @Column('json', { nullable: true })
  images: string[] | null;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  height: number;

  @Column({ type: 'int', default: 0 })
  width: number;

  @Column({ length: 64, nullable: true })
  canvasSize: string | null;

  @Column({ type: 'enum', enum: Availability, default: Availability.UNKNOWN })
  availability: Availability;

  @Column({
    type: 'enum',
    enum: ArtworkCategory,
    default: ArtworkCategory.OTHER,
  })
  category: ArtworkCategory;

  @Column({ type: 'enum', enum: Color, default: Color.BLACK })
  color: Color;

  @Column({ type: 'enum', enum: Framing, default: Framing.FRAMED })
  framing: Framing;

  @Column({ type: 'enum', enum: Orientation, default: Orientation.LANDSCAPE })
  orientation: Orientation;

  @Column({ type: 'enum', enum: Size, default: Size.S })
  size: Size;

  @Column({ length: 255, nullable: true })
  producedIn: string | null;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

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
  //** 1-to-many hasMany

  @OneToMany(() => Auction, (auction) => auction.artwork, {
    // cascade: ['insert', 'update'],
  })
  auctions: Auction[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  artistId: number | null; // to make it available to Repository.
  @ManyToOne(() => Artist, (artist) => artist.artworks, {
    onDelete: 'SET NULL',
  })
  artist: Artist;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  ownerId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.artworks, {
    onDelete: 'SET NULL',
  })
  owner: User;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.artworks)
  hashtags: Hashtag[];

  @ManyToMany(() => User, (user) => user.favoriteArtworks)
  @JoinTable({ name: 'artwork_user_like' }) // owning side
  users: User[];

  //??--------------------------------------------------------------------------*/
  //?? listeners

  @AfterLoad()
  updateImages() {
    if (!this.images) {
      this.images = [];
    }
  }

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Artwork>) {
  //   Object.assign(this, partial);
  // }
}
