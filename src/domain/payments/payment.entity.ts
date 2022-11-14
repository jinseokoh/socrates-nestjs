import { Exclude } from 'class-transformer';
import { PaymentStatus } from 'src/common/enums';
import { PaymentMethod } from 'src/common/enums/payment-method';
import { Destination } from 'src/domain/destinations/destination.entity';
import { Grant } from 'src/domain/grants/grant.entity';
import { Order } from 'src/domain/orders/order.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 주문
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  priceSubtotal: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  shippingSubtotal: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  shippingDiscount: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  couponDiscount: number;

  @Column({ type: 'int', unsigned: true, nullable: true, default: 0 })
  grandTotal: number;

  @Column({ length: 255, nullable: true })
  pgId: string | null;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.unknown })
  paymentStatus: PaymentStatus;

  @Column({ length: 255, nullable: true })
  paymentInfo: string | null;

  @Column('json', { nullable: true })
  payload: object | null;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  canceledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Order, (order) => order.payment, {
    // cascade: ['insert', 'update'],
  })
  orders: Order[];

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  grantId: number | null; // to make it available to Repository.
  @OneToOne(() => Grant, (grant) => grant.payment)
  @JoinColumn()
  grant: Grant;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  destinationId: number | null; // to make it available to Repository.
  @ManyToOne(() => Destination, (destination) => destination.payments, {
    onDelete: 'SET NULL',
  })
  destination: Destination;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.payments, {
    onDelete: 'SET NULL',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Order>) {
  //   Object.assign(this, partial);
  // }
}
