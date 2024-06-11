import { ApiProperty } from '@nestjs/swagger';
import { QuestionType, TargetGender } from 'src/common/enums';
import { Connection } from 'src/domain/dots/entities/connection.entity';
import { Plea } from 'src/domain/pleas/entities/plea.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsArray } from 'class-validator';
import { Faction } from 'src/domain/dots/entities/faction.entity';

@Entity()
export class Dot {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ length: 16, nullable: true })
  help: string | null;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'question' })
  question: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.SHORT_ANSWER,
    nullable: true,
  })
  @ApiProperty({ description: 'questionType' })
  questionType: QuestionType;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'options' })
  @IsArray()
  options: string[] | null;

  @Column({ default: false })
  @ApiProperty({ description: 'whether or not allow multiple answers' })
  allowMultiple: boolean;

  @Column('json', { nullable: true })
  @ApiProperty({ description: 'options' })
  aggregatedChoices: { [key: string]: number };

  @Column({ type: 'int', unsigned: true, default: 0 })
  answerCount: number;

  @Column({ default: false })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  @Column({ type: 'enum', enum: TargetGender, default: TargetGender.ALL })
  @ApiProperty({ description: 'gender looking for' })
  targetGender: TargetGender;

  @Column({ type: 'tinyint', unsigned: true, default: 18 })
  targetMinAge: number;

  @Column({ type: 'tinyint', unsigned: true, default: 66 })
  targetMaxAge: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  up: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  down: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Faction, (faction) => faction.dots, {
    cascade: true,
  })
  @JoinTable({ name: 'dot_faction' })
  factions: Faction[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => Connection, (connection) => connection.dot)
  public connections: Connection[];

  @OneToMany(() => Plea, (plea) => plea.dot)
  public pleas: Plea[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true, default: null })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.dots, {})
  user: User | null;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Dot>) {
    Object.assign(this, partial);
  }
}

/*
update `dot` set help='선호' where slug='love';
update `dot` set help='가치관' where slug='wow';
update `dot` set help='경험' where slug='cool';
update `dot` set help='최근' where slug='saint';
update `dot` set help='일상' where slug='yes';
update `dot` set help='가설' where slug='pirate';
update `dot` set help='논란' where slug='devil';
*/
