import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from 'src/common/enums/category';
import { Expense } from 'src/common/enums/expense';
import { Gender } from 'src/common/enums/gender';
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

@Entity() // 작품
export class Meetup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128 }) // from Auction
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 128, nullable: true }) // from Pack
  @ApiProperty({ description: 'subtitle' })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '모임정보' })
  body: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '이미지 URL' })
  image: string | null;

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.DINING,
  })
  @ApiProperty({ description: 'category' })
  category: Category;

  @Column({ type: 'enum', enum: Expense, default: Expense.BILLSONME })
  expense: Expense;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string;

  @Column({ default: false })
  isFlagged: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid', nullable: true })
  hostId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.hostMeetups, {
    onDelete: 'CASCADE',
  })
  host: User;

  @Exclude()
  @Column({ type: 'uuid', nullable: true })
  guestId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.hostMeetups, {
    onDelete: 'CASCADE',
  })
  guest: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Meetup>) {
  //   Object.assign(this, partial);
  // }
}
