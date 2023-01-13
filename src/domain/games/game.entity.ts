import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Rate } from 'src/common/enums/rate';
import { GameResult } from 'src/domain/game-results/game-result.entity';
import { User } from 'src/domain/users/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Game {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 1 })
  @ApiProperty({ description: 'wanted gender' })
  genderWanted: string;

  @Column({
    type: 'enum',
    enum: Rate,
    default: Rate.NSFW,
  })
  @ApiProperty({ description: 'rate', default: Rate.NSFW })
  rate: Rate;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => GameResult, (GameResult) => GameResult.game, {
    // cascade: ['insert', 'update'],
  })
  gameResults: GameResult[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

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
