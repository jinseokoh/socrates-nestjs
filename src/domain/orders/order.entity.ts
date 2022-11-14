import { Exclude } from 'class-transformer';
import { Courier } from 'src/common/enums/courier';
import { OrderStatus } from 'src/common/enums/order-status';
import { OrderType } from 'src/common/enums/order-type';
import { ShippingStatus } from 'src/common/enums/shipping-status';
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

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.WAITING })
  orderStatus: OrderStatus;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  price: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  shipping: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 1 })
  quantity: number; // this is a reserved property when dealing with general products

  @Column({ type: 'enum', enum: Courier, default: Courier.KDEXP })
  courier: Courier;

  @Column({ length: 32, nullable: true })
  trackingNumber: string | null;

  @Column({ length: 64, nullable: true })
  shippingComment: string | null;

  @Column({ default: false })
  isCombined: boolean;

  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PACKAGING,
  })
  shippingStatus: ShippingStatus;

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
