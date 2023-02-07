import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from 'src/common/enums/category';
import { User } from 'src/domain/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity() // 작품
export class Meetup extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 128 }) // from Auction
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 128 }) // from Pack
  @ApiProperty({ description: 'subtitle' })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: '모임정보' })
  body: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '이미지 URL' })
  image: string | null;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.AUCTION })
  orderType: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.WAITING })
  orderStatus: OrderStatus;

  @Column('json', { nullable: false })
  @ApiProperty({ description: '답변' })
  answers: string[];

  @Column({ default: false })
  isApproved: boolean;

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.FOOD,
  })
  @ApiProperty({ description: 'category' })
  category: Category;

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
  userId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.meetups, {
    onDelete: 'SET NULL',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Meetup>) {
  //   Object.assign(this, partial);
  // }
}
