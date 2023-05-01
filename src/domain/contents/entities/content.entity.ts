import { ApiProperty } from '@nestjs/swagger';
import { ContentCategory } from 'src/common/enums';
import { ContentSubCategory } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Content {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 32, nullable: true })
  slug: string;

  @Column({ length: 128 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ length: 255, nullable: true })
  image: string | null;

  @Column({
    type: 'enum',
    enum: ContentCategory,
    default: ContentCategory.NEWS,
  })
  category: ContentCategory;

  @Column({
    type: 'enum',
    enum: ContentSubCategory,
    default: ContentSubCategory.CAMPAIGN,
  })
  subCategory: ContentSubCategory;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Content>) {
    Object.assign(this, partial);
  }
}
