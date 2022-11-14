import { Exclude } from 'class-transformer';
import { Coupon } from 'src/domain/coupons/coupon.entity';
import { Payment } from 'src/domain/payments/payment.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity() //? grant (coupon to user)
@Unique('coupon_id_user_id_key', ['couponId', 'userId'])
export class Grant extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'datetime', nullable: true })
  couponUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Payment, (payment) => payment.grant)
  payment: Payment;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.grants, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  couponId: number | null; // to make it available to Repository.
  @ManyToOne(() => Coupon, (coupon) => coupon.grants, {
    onDelete: 'SET NULL',
  })
  coupon: Coupon;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<CouponList>) {
  //   Object.assign(this, partial);
  // }
}
