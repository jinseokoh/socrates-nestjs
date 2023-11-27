import { ApiProperty } from '@nestjs/swagger';
import { PartyType } from 'src/common/enums';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Room {
  @Column({ type: 'enum', enum: PartyType, default: PartyType.HOST })
  @ApiProperty({ description: 'host or guest' })
  partyType: PartyType;

  @Column({ default: false })
  @ApiProperty({ description: 'is Paid?' })
  isPaid: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is Confirmed?' })
  isConfirmed: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is Ended?' })
  isEnded: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is Banned?' })
  isBanned: boolean;

  @Column({ length: 36, nullable: true })
  @ApiProperty({
    description: 'last read message id ex) msg_1696663997213_##########',
  })
  lastMessageId: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: 'last message' })
  lastMessage: string | null;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'appointment' })
  appointedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //@Exclude()
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    // onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  public user!: User;

  //@Exclude()
  @PrimaryColumn({ type: 'int', unsigned: true })
  public meetupId!: number;

  @ManyToOne(() => Meetup, (meetup) => meetup.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    // onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;
}
