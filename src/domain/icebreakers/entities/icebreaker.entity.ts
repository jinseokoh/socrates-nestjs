import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { TargetGender } from 'src/common/enums';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/domain/users/entities/user.entity';
import { IcebreakerComment } from 'src/domain/icebreakers/entities/icebreaker_comment.entity';
import { Flag } from 'src/domain/users/entities/flag.entity';
import { BookmarkUserIcebreaker } from 'src/domain/users/entities/bookmark_user_icebreaker.entity';
import { Question } from 'src/domain/icebreakers/entities/question.entity';

@Entity()
export class Icebreaker {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, nullable: true })
  recipientId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, nullable: true })
  questionId: number | null; // to make it available to Repository.

  @Column({ length: 128 }) // from Auction
  @ApiProperty({ description: '내용' })
  body: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지들' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'enum', enum: TargetGender, default: TargetGender.ALL })
  @ApiProperty({ description: 'gender looking for' })
  targetGender: TargetGender;

  @Column({ type: 'tinyint', unsigned: true, default: 18 })
  targetMinAge: number;

  @Column({ type: 'tinyint', unsigned: true, default: 66 })
  targetMaxAge: number;

  // ------------------------------------------------------------------------ //

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'view count' })
  viewCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'comment count' })
  commentCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'likes' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count = like count' })
  bookmarkCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  // ------------------------------------------------------------------------ //

  @Index('created-at-index')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //? ----------------------------------------------------------------------- //
  //? many-to-1 (belongsTo)

  @ManyToOne(() => User, (user) => user.icebreakers, { cascade: true })
  user?: User;

  @ManyToOne(() => Question, (question) => question.icebreakers)
  question?: Question;

  //? ----------------------------------------------------------------------- //
  //? many-to-many belongsToMany using one-to-many (hasMany)

  @OneToMany(() => IcebreakerComment, (comment) => comment.icebreaker)
  public comments: IcebreakerComment[];

  @OneToMany(() => BookmarkUserIcebreaker, (bookmark) => bookmark.icebreaker)
  public bookmarks: BookmarkUserIcebreaker[];

  @OneToMany(() => Flag, (flag) => flag.entityId)
  public flags: Flag[];

  //? ----------------------------------------------------------------------- //
  //? many-to-many (belongsToMany)

  // 이 정보는 icebreaker 이 삭제되더라도 지우지 않고 유지 하기로
  // @ManyToMany(() => Career, (career) => career.icebreakers)
  // @JoinTable({ name: 'icebreaker_career' }) // owning side
  // careers: Career[];

  // 이 정보는 icebreaker 이 삭제되더라도 지우지 않고 유지 하기로
  // @ManyToMany(() => Category, (category) => category.icebreakers)
  // @JoinTable({ name: 'icebreaker_category' }) // owning side
  // categories: Category[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Icebreaker>) {
    Object.assign(this, partial);
  }
}
