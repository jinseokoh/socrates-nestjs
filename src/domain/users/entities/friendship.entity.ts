import { ApiProperty } from '@nestjs/swagger';
import { FriendRequestType, FriendStatus } from 'src/common/enums';
import { Plea } from 'src/domain/feeds/entities/plea.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Unique,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  UpdateDateColumn,
} from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_recipient_id_key', ['userId', 'recipientId'])
export class Friendship {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true })
  recipientId: number; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, default: null })
  pleaId: number | null; // to make it available to Repository.

  @Column({ length: 80, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @Column({
    type: 'enum',
    enum: FriendRequestType,
    default: FriendRequestType.DISCLOSED,
  })
  @ApiProperty({ description: 'anonymous|disclosed' })
  friendRequestType: FriendRequestType;

  @Column({
    type: 'enum',
    enum: FriendStatus,
    default: FriendStatus.PENDING,
  })
  @ApiProperty({ description: 'pending|accepted' })
  status: FriendStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //? -------------------------------------------------------------------------/
  //? many-to-many belongsToMany using many-to-one

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  public user!: User;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  @OneToOne(() => Plea, (plea) => plea.id, {
    nullable: true,
  })
  @JoinColumn({ name: 'pleaId' })
  public plea: Plea;

  //? -------------------------------------------------------------------------/
  //? constructor

  constructor(partial: Partial<Friendship>) {
    Object.assign(this, partial);
  }
}
