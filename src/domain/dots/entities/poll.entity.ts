import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'poll title' })
  title: string;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'poll help' })
  help: string | null;

  @Column('json')
  @ApiProperty({ description: 'poll options' })
  @IsArray()
  options: string[];

  @Column('json')
  @ApiProperty({ description: 'poll answers' })
  @IsArray()
  answers: number[];

  @Column({ default: false })
  @ApiProperty({ description: 'allow multiple answers' })
  allowDups: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Poll>) {
    Object.assign(this, partial);
  }
}
