import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { JoinStatus } from 'src/common/enums';
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

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Friendship {
  @Column({ type: 'enum', enum: JoinStatus, nullable: true })
  @ApiProperty({ description: 'ACCEPTED|DENIED' })
  status: JoinStatus;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  senderId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'senderId' })
  public sender!: User;

  @PrimaryColumn({ type: 'int', unsigned: true })
  recipientId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Friendship>) {
    Object.assign(this, partial);
  }
}
