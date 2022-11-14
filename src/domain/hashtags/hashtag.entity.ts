import { Exclude } from 'class-transformer';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 작품 레이블링을 위한 해쉬택
export class Hashtag extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64 })
  key: string;

  @Column({ length: 64 })
  title: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // https://stackoverflow.com/questions/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;
  @OneToMany(() => Hashtag, (hashtag) => hashtag.parent)
  children: Hashtag[];

  @ManyToOne(() => Hashtag, (hashtag) => hashtag.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Hashtag;

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
