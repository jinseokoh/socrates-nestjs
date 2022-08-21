import { Exclude } from 'class-transformer';
import { Post } from 'src/domain/posts/post.entity';
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
export class PostComment extends BaseEntity {
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
  @ManyToOne(() => User, (user) => user.postComments, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  postId: number | null; // to make it available to Repository.
  @ManyToOne(() => Post, (post) => post.postComments, {
    onDelete: 'SET NULL',
  })
  post: Post;

  //**--------------------------------------------------------------------------*/
  //** one to many (self recursive relations)
  // https://stackoverflow.com/questions/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @OneToMany(() => PostComment, (postComment) => postComment.parent)
  children: PostComment[];

  @ManyToOne(() => PostComment, (postComment) => postComment.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: PostComment;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<PostComment>) {
  //   Object.assign(this, partial);
  // }
}
