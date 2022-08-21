import { Grant } from 'src/domain/grants/grant.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자에게 발급가능한 쿠폰
export class Coupon extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 64 })
  code: string;

  @Column({ type: 'int' })
  discount: number;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  expiredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Grant, (grant) => grant.coupon, {
    // cascade: ['insert', 'update'],
  })
  grants: Grant[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many

  // @ManyToMany(() => User, (user) => user.coupons)
  // @JoinTable({ name: 'coupon_user' }) // owning side
  // users: User[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Coupon>) {
  //   Object.assign(this, partial);
  // }
}
