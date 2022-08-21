import { Artwork } from 'src/domain/artworks/artwork.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 작품 레이블링을 위한 해쉬택
export class Hashtag extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 128 })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Artwork, (artwork) => artwork.hashtags)
  @JoinTable({ name: 'hashtag_artwork' }) // owning side
  artworks: Artwork[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Hashtag>) {
  //   Object.assign(this, partial);
  // }
}
