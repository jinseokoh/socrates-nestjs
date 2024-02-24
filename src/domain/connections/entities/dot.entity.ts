import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { DotStatus } from 'src/common/enums';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { Plea } from 'src/domain/users/entities/plea.entity';
import { Friendship } from 'src/domain/users/entities/friendship.entity';
import { User } from 'src/domain/users/entities/user.entity';
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
export class Dot {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'question' })
  question: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  answers: number;

  @Column({ default: false })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: DotStatus,
    default: DotStatus.PENDING,
    nullable: true,
  })
  @ApiProperty({ description: 'status' })
  status: DotStatus;

  @Column({ type: 'int', unsigned: true, default: 0 })
  up: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  down: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date | null;

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
