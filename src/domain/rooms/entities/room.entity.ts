import { ApiProperty } from '@nestjs/swagger';
import { RateEnum } from 'src/common/enums/rate';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Room {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 1 })
  @ApiProperty({ description: 'wanted gender' })
  genderWanted: string;

  @Column({
    type: 'enum',
    enum: RateEnum,
    default: RateEnum.NSFW,
  })
  @ApiProperty({ description: 'rate', default: RateEnum.NSFW })
  rate: RateEnum;

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

  // @Exclude()
  // @Column({ type: 'uuid', length: 36, nullable: true })
  // hostId: string | null; // to make it available to Repository.
  // @ManyToOne(() => User, (user) => user.hostRooms, {
  //   onDelete: 'SET NULL',
  // })
  // host: User;

  // @Exclude()
  // @Column({ type: 'uuid', length: 36, nullable: true })
  // guestId: string | null; // to make it available to Repository.
  // @ManyToOne(() => User, (user) => user.guestRooms, {
  //   onDelete: 'SET NULL',
  // })
  // guest: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Room>) {
  //   Object.assign(this, partial);
  // }
}
