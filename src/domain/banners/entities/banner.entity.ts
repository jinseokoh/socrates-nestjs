import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 배너
export class Banner {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64 })
  title: string;

  @Column({ length: 255, nullable: true })
  asset: string | null;

  @Column({ length: 255, nullable: true })
  url: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ default: false })
  @ApiProperty({ description: "whether or not it's published" })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Banner>) {
    Object.assign(this, partial);
  }
}
