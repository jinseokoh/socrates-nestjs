import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Game } from 'src/domain/games/game.entity';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class GameResult extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '질문' })
  question: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: '답변' })
  answer: string | null;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  @ApiProperty({ description: 'user score' })
  userScore: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  @ApiProperty({ description: 'other score' })
  otherScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  gameId: number;
  @ManyToOne(() => Game, (game) => game.gameResults, {
    onDelete: 'CASCADE',
  })
  game: Game;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  hostId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.hostGames, {
    onDelete: 'SET NULL',
  })
  host: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  guestId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.guestGames, {
    onDelete: 'SET NULL',
  })
  guest: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Game>) {
  //   Object.assign(this, partial);
  // }
}
