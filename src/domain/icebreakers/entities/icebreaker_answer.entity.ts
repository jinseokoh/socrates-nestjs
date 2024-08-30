import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Icebreaker } from 'src/domain/icebreakers/entities/icebreaker.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { IsArray } from 'class-validator';

@Entity()
@Unique('user_id_icebreaker_id_key', ['userId', 'icebreakerId'])
export class IcebreakerAnswer {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, nullable: true })
  icebreakerId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, nullable: true })
  parentId: number | null;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
  body: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '이미지들' })
  @IsArray()
  images: string[] | null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'bookmark count' })
  bookmarkCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'like count' })
  likeCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //? ----------------------------------------------------------------------- //
  //? many-to-1 belongsTo

  @ManyToOne(() => User, (user) => user.icebreakerAnswers, { cascade: true })
  user: User;

  //? ----------------------------------------------------------------------- //
  //? many-to-1 belongsTo

  @ManyToOne(() => Icebreaker, (icebreaker) => icebreaker.answers, {
    cascade: true,
  })
  icebreaker: Icebreaker;

  //? ----------------------------------------------------------------------- //
  //? one to many (self recursive relations)
  // data structure ref)
  // https://stackoverflow.com/threads/67385016/getting-data-in-self-referencing-relation-with-typeorm

  @ManyToOne(
    () => IcebreakerAnswer,
    (IcebreakerAnswer) => IcebreakerAnswer.children,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'parentId' })
  parent: IcebreakerAnswer;

  @OneToMany(() => IcebreakerAnswer, (thread) => thread.parent)
  children: IcebreakerAnswer[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<IcebreakerAnswer>) {
    Object.assign(this, partial);
  }
}
