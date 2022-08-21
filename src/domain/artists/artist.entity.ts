import { Exclude } from 'class-transformer';
import { Genre } from 'src/common/enums';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { Pack } from 'src/domain/packs/pack.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 작가; 사용자가 존재해야만 작가를 생성할 수 있음.
export class Artist extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 32, nullable: true })
  name: string | null;

  @Column({ length: 255, nullable: true })
  intro: string | null;

  @Column({ type: 'text', nullable: true })
  credentials: string | null;

  @Column({ length: 255, nullable: true })
  sns: string | null;

  @Column({ type: 'enum', enum: Genre, default: Genre.PAINTER })
  genre: Genre;

  @Column({ length: 2, default: 'kr' })
  nationality: string;

  @Exclude()
  @Column({ length: 255, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @OneToOne(() => User, (user) => user.artist, { eager: true })
  @JoinColumn()
  user: User;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Artwork, (artwork) => artwork.artist, {
    // cascade: ['insert', 'update'],
  })
  artworks: Artwork[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Pack, (pack) => pack.artists)
  packs: Pack[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Artist>) {
  //   Object.assign(this, partial);
  // }
}
