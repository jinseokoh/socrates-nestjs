import { ApiProperty } from '@nestjs/swagger';
import { PartyType } from 'src/common/enums';
import { Room } from 'src/domain/chats/entities/room.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  roomId: number;

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
