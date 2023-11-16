import { ApiProperty } from '@nestjs/swagger';
import { ButtonType } from 'src/common/enums';
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

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ length: 255, nullable: true })
  image: string | null;

  @Column({ length: 32 })
  @ApiProperty({ description: 'button label', nullable: true })
  buttonLabel: string | null;

  @Column({ type: 'enum', enum: ButtonType, default: ButtonType.INFO })
  @ApiProperty({ description: 'button type' })
  buttonType: ButtonType;

  @Column({ default: false })
  @ApiProperty({ description: "whether or not it's published" })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Banner>) {
    Object.assign(this, partial);
  }
}
