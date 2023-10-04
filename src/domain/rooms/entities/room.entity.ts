import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsArray } from 'class-validator';
import { PartyType } from 'src/common/enums';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Room {
  @Column({ type: 'tinyint', unsigned: true, default: 2 })
  @ApiProperty({ description: '# of maximum participants' })
  max: number;

  @Column({ type: 'enum', enum: PartyType, default: PartyType.HOST })
  @ApiProperty({ description: 'host or guest' })
  partyType: PartyType;

  @Column({ default: false })
  @ApiProperty({ description: 'is Flagged?' })
  isFlagged: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is Flagged?' })
  isPaid: boolean;

  @Column({ length: 128, nullable: true })
  @ApiProperty({ description: 'message' })
  note: string | null;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'appointment' })
  appointedAt: Date | null;

  @Index('created-at-index')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //@Exclude()
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  public user!: User;

  //@Exclude()
  @PrimaryColumn({ type: 'int', unsigned: true })
  public meetupId!: number;

  @ManyToOne(() => Meetup, (meetup) => meetup.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;
}
