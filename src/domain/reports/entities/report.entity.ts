import { Exclude } from 'class-transformer';
import { ReportStatus, ReportTarget } from 'src/common/enums';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Report {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: number;

  @Column({
    type: 'enum',
    enum: ReportTarget,
    default: ReportTarget.USER,
  })
  target: ReportTarget;

  @Column({ length: 36, nullable: true })
  targetId: string | null;

  @Column({ length: 255 })
  reason: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  reportStatus: ReportStatus;

  @Column({ type: 'text', nullable: true })
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

  @ManyToOne(() => User, (user) => user.reports, {
    onDelete: 'CASCADE', // SET NULL seems to cause 500 error
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Report>) {
    Object.assign(this, partial);
  }
}
