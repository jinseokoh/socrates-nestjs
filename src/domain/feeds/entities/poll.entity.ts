import { ApiProperty } from '@nestjs/swagger';
import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
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
import { IsArray } from 'class-validator';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'question' })
  question: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'options' })
  @IsArray()
  options: string[] | null;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '진행 결과' })
  aggregatedAnswers: { [key: string]: number };

  @Column({ type: 'int', unsigned: true, default: 0 })
  answerCount: number;

  @Column({ default: false })
  @ApiProperty({ description: 'whether or not allow multiple answers' })
  isMultiple: boolean;

  @Column({ default: true })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => Feed, (feed) => feed.poll)
  public feeds: Feed[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true, default: null })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.polls, {})
  user: User | null;

  @Column({ type: 'int', unsigned: true, default: null })
  feedId: number | null; // to make it available to Repository.

  @ManyToOne(() => Feed, (feed) => feed.poll, {})
  @JoinColumn()
  feed: Feed | null;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Poll>) {
    Object.assign(this, partial);
  }
}

/*
update `poll` set help='선호' where slug='love';
update `poll` set help='가치관' where slug='wow';
update `poll` set help='경험' where slug='cool';
update `poll` set help='최근' where slug='saint';
update `poll` set help='일상' where slug='yes';
update `poll` set help='가설' where slug='pirate';
update `poll` set help='논란' where slug='devil';
*/
