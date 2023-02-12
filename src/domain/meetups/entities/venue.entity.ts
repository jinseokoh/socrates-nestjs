import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 장소
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64 }) // from Auction
  @ApiProperty({ description: '제목' })
  venue?: string | null;

  @Column({ length: 128 }) // from Auction
  @ApiProperty({ description: '제목' })
  address?: string | null;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  geolocation?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 belongsTo

  @Exclude()
  @Column({ type: 'string', length: 36 })
  meetupId: string; // to make it available to Repository.

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Article>) {
  //   Object.assign(this, partial);
  // }
}
