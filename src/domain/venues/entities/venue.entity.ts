import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 })
  @ApiProperty({ description: '장소명' })
  name: string;

  @Column({ length: 128, nullable: true }) // from Auction
  @ApiProperty({ description: '주소' })
  address?: string | null;

  @Column({ length: 128, nullable: true }) // from Auction
  @ApiProperty({ description: 'comma separated hashtags for this venue' })
  tags?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  @ApiProperty({ description: '위도' })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  @ApiProperty({ description: '경도' })
  longitude: number;

  @Column({ length: 32 })
  @ApiProperty({ description: '네이버 장소ID' })
  providerId: string;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsToMany

  // it's not worth maintaining this relationship after all.
  // @Exclude()
  // @Column({ type: 'uuid', length: 36 })
  // userId: string; // to make it available to Repository.

  // @ManyToOne(() => User, (user) => user.venues, {
  //   onDelete: 'SET NULL',
  // })
  // user: User;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsToOne

  @Exclude()
  @Column({ type: 'uuid', length: 36 })
  meetupId: string; // to make it available to Repository.

  @OneToOne(() => Meetup, (meetup) => meetup.venue)
  @JoinColumn()
  meetup: Meetup;
}
