import { NewsCategory } from 'src/common/enums/news-category';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 배너광고 형태로 보여줄 콘텐츠
export class News extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 128 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column('json', { nullable: true })
  images: object[] | null;

  @Column({
    type: 'enum',
    enum: NewsCategory,
    default: NewsCategory.GENERAL,
  })
  category: NewsCategory;

  @Column({ default: false })
  isFixed: boolean;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<News>) {
  //   Object.assign(this, partial);
  // }
}
