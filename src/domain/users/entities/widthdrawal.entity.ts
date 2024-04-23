import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Withdrawal {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64, unique: true })
  @ApiProperty({ description: 'email' })
  email: string;

  @Column({ length: 128, nullable: true })
  @ApiProperty({ description: 'reason to quit' })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @OneToOne(() => User, (user) => user.withdrawal)
  @JoinColumn()
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Withdrawal>) {
    Object.assign(this, partial);
  }
}
