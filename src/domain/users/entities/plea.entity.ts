import { ApiProperty } from '@nestjs/swagger';
import { Dot } from 'src/domain/connections/entities/dot.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Plea {
  @Column({ default: false })
  @ApiProperty({ description: 'is read?' })
  isRead: boolean;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  reward: number | null;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'expiration date' })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  askingUserId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.askingPleas, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'askingUserId' })
  public askingUser: User;

  @PrimaryColumn({ type: 'int', unsigned: true })
  askedUserId: number | null;

  @ManyToOne(() => User, (user) => user.askedPleas, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'askedUserId' })
  public askedUser: User;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public dotId: number;

  @ManyToOne(() => Dot, (dot) => dot.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dotId' })
  public dot: Dot;
}
