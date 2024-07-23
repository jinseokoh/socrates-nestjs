import { ApiProperty } from '@nestjs/swagger';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique('sender_id_recipient_id_feed_id_key', [
  'userId',
  'recipientId',
  'feedId',
])
export class Plea {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  // @Column({
  //   type: 'enum',
  //   enum: PleaStatus,
  //   default: PleaStatus.INIT,
  // })
  // @ApiProperty({ description: 'ACCEPTED|PENDING|NILL' })
  // status: PleaStatus;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  reward: number | null;

  @Column({ length: 64, nullable: true })
  message: string | null;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '1달 동안만 사용가능' })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'int', unsigned: true })
  userId: number;

  @Column({ type: 'int', unsigned: true })
  recipientId: number;

  @Column({ type: 'int', unsigned: true })
  feedId: number;

  //? -------------------------------------------------------------------------/
  //? many-to-many belongsToMany using many-to-one

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  public sender!: User;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  @ManyToOne(() => Feed, (feed) => feed.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feedId' })
  public feed: Feed;

  //? -------------------------------------------------------------------------/
  //? constructor

  constructor(partial: Partial<Plea>) {
    Object.assign(this, partial);
  }
}
