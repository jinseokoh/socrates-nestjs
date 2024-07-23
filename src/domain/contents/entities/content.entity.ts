import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { ContentComment } from 'src/domain/contents/entities/content_comment.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Content {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ length: 64, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: false })
  body: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'views' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //* ----------------------------------------------------------------------- */
  //* 1-to-many (hasMany)

  @OneToMany(() => ContentComment, (comment) => comment.content)
  comments: ContentComment[];

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Content>) {
    Object.assign(this, partial);
  }
}
