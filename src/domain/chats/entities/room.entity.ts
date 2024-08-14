import { ApiProperty } from '@nestjs/swagger';
import { RoomStatus } from 'src/common/enums';
import { Participant } from 'src/domain/chats/entities/participant.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['slug']) // 이 필드를 유니크하게 설정
export class Room {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128, nullable: false })
  @ApiProperty({ description: 'slug' })
  slug: string;

  @Column({ length: 80, nullable: true })
  @ApiProperty({ description: 'title' })
  title: string;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.PENDING })
  @ApiProperty({ description: 'status' })
  roomStatus: RoomStatus;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  @ApiProperty({ description: '참여자 수' })
  participantCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: '신고 횟수' })
  flagCount: number;

  @Column({ length: 36, nullable: true })
  @ApiProperty({
    description: 'last read message id ex) msg_1696663997213_##########',
  })
  lastMessageId: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: 'last message' })
  lastMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //? ----------------------------------------------------------------------- //
  //? 1-to-1 hasOne

  @OneToOne(() => Meetup, (meetup) => meetup.room)
  meetup?: Meetup | null;

  //? ----------------------------------------------------------------------- //
  //? 1-to-many hasMany

  //! One-to-Many 관계에서 부모 엔티티와 함께 자식 엔티티를 한 번에 저장하거나 업데이트하려는 경우,
  //! cascade: true 가 필요.
  @OneToMany(() => Participant, (participant) => participant.room, {
    cascade: true,
  })
  participants: Participant[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Room>) {
    Object.assign(this, partial);
  }
}
