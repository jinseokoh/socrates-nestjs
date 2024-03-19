import { ApiProperty } from '@nestjs/swagger';
import { PleaStatus } from 'src/common/enums';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
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

  @Column({
    type: 'enum',
    enum: PleaStatus,
    default: PleaStatus.INIT,
  })
  @ApiProperty({ description: 'ACCEPTED|PENDING|NILL' })
  status: PleaStatus;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  reward: number | null;

  @Column({ length: 64, nullable: true })
  message: string | null;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: '1달 동안만 사용가능' })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'int', unsigned: true })
  senderId: number;

  @Column({ type: 'int', unsigned: true })
  recipientId: number;

  @Column({ type: 'int', unsigned: true })
  dotId: number;

  // only if user answered the dot question.
  @Column({ type: 'int', unsigned: true, nullable: true })
  connectionId: number | null;

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
