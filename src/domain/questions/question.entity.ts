import { Exclude } from 'class-transformer';
import { Artwork } from 'src/domain/artworks/artwork.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? Question; 앱에서 사용하는 콘텐츠 단위
export class Question extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: true }) // this can be switched to enum of {ARTIST|RESELLER}
  sellerType: string | null;

  @Column({ length: 255, nullable: true })
  question: string | null;

  @Column({ length: 255, nullable: true })
  answer: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  artworkId: number; // to make it available to Repository.

  @OneToOne(() => Artwork, (artwork) => artwork.question)
  @JoinColumn()
  artwork: Artwork;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.questions, {
    onDelete: 'SET NULL',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Question>) {
  //   Object.assign(this, partial);
  // }
}
