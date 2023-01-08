import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Rate } from 'src/common/enums/rate';
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
export class Game extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '제목' })
  title: string;

  @Column({ length: 1 })
  @ApiProperty({ description: 'gender' })
  gender: string;

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
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.games, {
    onDelete: 'SET NULL',
  })
  user: User;

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  otherId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.games, {
    onDelete: 'SET NULL',
  })
  other: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Game>) {
  //   Object.assign(this, partial);
  // }
}
