import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Withdrawal {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.

  @Column({ length: 128, unique: true })
  @ApiProperty({
    description:
      'provider 의 providerId 를 모두 저장하여, 같은 id 가 탈퇴이후 다시 사용되는지 체크하기 위함',
  })
  providerId: string;

  @Column({ length: 80, nullable: true })
  @ApiProperty({ description: 'reason to quit' })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //? ----------------------------------------------------------------------- //
  //? many-to-1 belongsTo

  @ManyToOne(() => User, (user) => user.withdrawals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user?: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Withdrawal>) {
    Object.assign(this, partial);
  }
}
