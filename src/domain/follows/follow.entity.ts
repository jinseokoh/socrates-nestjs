import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity() //? 팔로워
// @Unique('following_id_follower_id_key', ['followingId', 'followerId'])
export class Follow extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  followingId: number | null;
  @ManyToOne(() => User, (user) => user.followings)
  @JoinColumn({ name: 'followingId' })
  following: User; // someone I follow

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  followerId: number | null;
  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: 'followerId' })
  follower: User; // someone follows me

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Follow>) {
  //   Object.assign(this, partial);
  // }
}
