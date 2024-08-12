import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
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
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  // @Column({ type: 'int', unsigned: true })
  // userId: number; // to make it available to Repository.

  // @Column({ length: 32, nullable: true })
  // entityType: string | null;

  // @Column({ type: 'int', unsigned: true, nullable: true })
  // entityId: number | null;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ length: 64, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: false })
  body: string;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '이미지' })
  @IsString()
  @IsOptional()
  image: string | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'views count' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  likeCount: number;

  // @Column({ type: 'int', unsigned: true, default: 0 })
  // @ApiProperty({ description: 'bookmark count' })
  // bookmarkCount: number;

  // @Column({ type: 'int', unsigned: true, default: 0 })
  // @ApiProperty({ description: 'flag count' })
  // flagCount: number;

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

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Content>) {
    Object.assign(this, partial);
  }
}
