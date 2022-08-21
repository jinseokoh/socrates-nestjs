import { Exclude } from 'class-transformer';
import { Article } from 'src/domain/articles/article.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 아티클에 달리는 댓글 (현재 댓글의 댓글 기능은 없음.)
export class ArticleComment extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255 })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.articleComments, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  articleId: number | null; // to make it available to Repository.
  @ManyToOne(() => Article, (article) => article.articleComments, {
    onDelete: 'SET NULL',
  })
  article: Article;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // https://stackoverflow.com/questions/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => ArticleComment, (articleComment) => articleComment.parent)
  children: ArticleComment[];

  @ManyToOne(
    () => ArticleComment,
    (articleComment) => articleComment.children,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'parentId' })
  parent: ArticleComment;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<ArticleComment>) {
  //   Object.assign(this, partial);
  // }
}
