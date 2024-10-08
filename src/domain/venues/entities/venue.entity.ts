import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Venue {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64 })
  @ApiProperty({ description: '장소명' })
  name: string;

  @Column({ length: 128, nullable: true })
  @ApiProperty({ description: '주소' })
  address?: string | null;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'image' })
  image: string;

  @Column({ length: 128, nullable: true })
  @ApiProperty({ description: 'comma separated hashtags for this venue' })
  tags?: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    // transformer: new ColumnNumericTransformer(),
  })
  @Transform(({ value }) => parseFloat(value))
  @ApiProperty({ description: '위도' })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
  })
  @Transform(({ value }) => parseFloat(value))
  @ApiProperty({ description: '경도' })
  longitude: number;

  @Index()
  @Column({ length: 32 })
  @ApiProperty({ description: '네이버 장소ID, 방구석은 `home${userId}`' })
  providerId: string;

  //**------------------------------------------------------------------------*/
  //** many-to-1 belongsToMany

  // it's not worth maintaining this relationship after all.
  // @Column({ type: 'uuid', length: 36 })
  // userId: string; // to make it available to Repository.

  // @ManyToOne(() => User, (user) => user.venues, {
  //   onDelete: 'SET NULL',
  // })
  // user: User;

  //**------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Meetup, (meetup) => meetup.venue)
  meetups: Meetup[];

  //?-------------------------------------------------------------------------*/
  //? constructor

  constructor(partial: Partial<Venue>) {
    Object.assign(this, partial);
  }
}
