import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Rate } from 'src/common/enums/rate';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 1 })
  @ApiProperty({ description: 'wanted gender' })
  genderWanted: string;

  @Column({
    type: 'enum',
    enum: Rate,
    default: Rate.NSFW,
  })
  @ApiProperty({ description: 'rate', default: Rate.NSFW })
  rate: Rate;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  // @OneToMany(() => RoomResult, (RoomResult) => RoomResult.room, {
  //   // cascade: ['insert', 'update'],
  // })
  // roomResults: RoomResult[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid', nullable: true })
  hostId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.hostRooms, {
    onDelete: 'SET NULL',
  })
  host: User;

  @Exclude()
  @Column({ type: 'uuid', nullable: true })
  guestId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.guestRooms, {
    onDelete: 'SET NULL',
  })
  guest: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Room>) {
  //   Object.assign(this, partial);
  // }
}
