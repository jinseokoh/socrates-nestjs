import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { FriendshipStatus, RequestFrom } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Friendship {
  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.NILL,
  })
  @ApiProperty({ description: 'ACCEPTED|PENDING|NILL' })
  status: FriendshipStatus;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @Column({
    type: 'enum',
    enum: RequestFrom,
    default: RequestFrom.CONNECTION,
  })
  @ApiProperty({ description: 'PROFILE|CONNECTION' })
  requestFrom: RequestFrom;

  //? in case you need to store info about which ones are diposable. you can do that w/ this.
  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'readable dot Ids' })
  @IsArray()
  dotIds: number[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  senderId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'senderId' })
  public sender!: User;

  @PrimaryColumn({ type: 'int', unsigned: true })
  recipientId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Friendship>) {
    Object.assign(this, partial);
  }
}
