import { Exclude } from 'class-transformer';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 경매입찰내용
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  amount: number;

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
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'string', nullable: true })
  meetupId: string | null; // to make it available to Repository.
  @ManyToOne(() => Meetup, (meetup) => meetup.bookmarks, {
    onDelete: 'CASCADE',
  })
  meetup: Meetup;

  @Exclude()
  @Column({ type: 'uuid', length: 36, nullable: true })
  userId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.bookmarks, {
    onDelete: 'CASCADE',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Bookmark>) {
  //   Object.assign(this, partial);
  // }
}
