import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from 'src/common/enums';
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

  @Column({ length: 64 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ length: 255, nullable: true })
  image: string | null;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.ANNOUNCEMENTS,
  })
  contentType: ContentType;

  @Column({ default: false })
  @ApiProperty({ description: "whether or not it's published" })
  isPublished: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'views' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

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
