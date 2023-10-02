import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Ledger as LedgerType } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Ledger {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  @ApiProperty({ description: '코인증가' })
  debit: number;

  @Column({ type: 'int', unsigned: true })
  @ApiProperty({ description: '코인감소' })
  credit: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: '현재보유액' })
  balance: number;

  @Column({ type: 'enum', enum: LedgerType, default: LedgerType.CREDIT_SPEND })
  @ApiProperty({ description: 'ledgerType' })
  ledgerType: LedgerType;

  @Column({ length: 128, nullable: true }) // from Auction
  @ApiProperty({ description: '비고' })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.ledgers, {
    onDelete: 'CASCADE',
  })
  user?: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Ledger>) {
    Object.assign(this, partial);
  }
}
