import { Exclude } from 'class-transformer';
import { Payment } from 'src/domain/payments/payment.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자 배송지
export class Destination extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64, nullable: true })
  title: string | null;

  @Column({ length: 64, nullable: true })
  name: string | null;

  @Column({ length: 32, nullable: true })
  phone: string | null;

  @Column({ length: 16, nullable: true })
  postalCode: string | null;

  @Column({ length: 128, nullable: true })
  address: string | null;

  @Column({ length: 128, nullable: true })
  addressDetail: string | null;

  @Column({ length: 32, nullable: true })
  city: string | null;

  @Column({ length: 32, nullable: true })
  state: string | null;

  @Column({ length: 64, nullable: true })
  country: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Payment, (payment) => payment.destination, {
    // cascade: ['insert', 'update']
  })
  payments: Payment[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.destinations)
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Provider>) {
  //   Object.assign(this, partial);
  // }
}
