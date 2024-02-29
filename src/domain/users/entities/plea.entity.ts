import { ApiProperty } from '@nestjs/swagger';
import { Dot } from 'src/domain/connections/entities/dot.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique('sender_id_recipient_id_dot_id_key', [
  'senderId',
  'recipientId',
  'dotId',
])
export class Plea {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  public id: number;

  @Column({ default: false })
  @ApiProperty({ description: 'is read?' })
  isRead: boolean;

  @Column({ length: 64, nullable: true })
  message: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  reward: number | null;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'expiration date' })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'int', unsigned: true })
  senderId: number;

  @Column({ type: 'int', unsigned: true })
  recipientId: number;

  @Column({ type: 'int', unsigned: true })
  dotId: number;

  //? -------------------------------------------------------------------------/
  //? many-to-many belongsToMany using many-to-one

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'senderId' })
  public sender!: User;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  @ManyToOne(() => Dot, (dot) => dot.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dotId' })
  public dot: Dot;

  //? -------------------------------------------------------------------------/
  //? constructor

  constructor(partial: Partial<Plea>) {
    Object.assign(this, partial);
  }
}
