import { Exclude } from 'class-transformer';
import { OrderType } from 'src/common/enums/order-type';
import { Auction } from 'src/domain/auctions/auction.entity';
import { Payment } from 'src/domain/payments/payment.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 주문아이템
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  title: string;

  @Column({ length: 255, nullable: true })
  image: string | null;

  @Column({ type: 'enum', enum: OrderType, default: OrderType.AUCTION })
  orderType: OrderType;

  @Column({ length: 128, nullable: true })
  sku: string | null;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  price: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  deliveryFee: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 1 })
  quantity: number;

  @Column({ type: 'bool', default: false })
  isPaid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  auctionId: number | null; // to make it available to Repository.
  @OneToOne(() => Auction, (auction) => auction.order)
  @JoinColumn()
  auction: Auction;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  paymentId: number | null; // to make it available to Repository.
  @ManyToOne(() => Payment, (payment) => payment.orders, {
    onDelete: 'SET NULL',
  })
  payment: Payment;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Order>) {
  //   Object.assign(this, partial);
  // }
}
