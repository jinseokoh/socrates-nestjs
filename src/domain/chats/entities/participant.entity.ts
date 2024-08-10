import { ApiProperty } from '@nestjs/swagger';
import { PartyType } from 'src/common/enums';
import { Room } from 'src/domain/chats/entities/room.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Entity,
  ManyToOne,
  JoinColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Participant {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number; // to make it available to Repository.

  @PrimaryColumn({ type: 'int', unsigned: true })
  public roomId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.participants)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Room, (room) => room.participants)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ type: 'enum', enum: PartyType, default: PartyType.HOST })
  @ApiProperty({ description: 'host or guest' })
  partyType: PartyType;

  @Column({ default: false })
  @ApiProperty({ description: 'is Paid?' })
  isPaid: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'is Banned?' })
  isBanned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
