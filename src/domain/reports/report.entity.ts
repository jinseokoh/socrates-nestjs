import { Exclude } from 'class-transformer';
import { ReportStatus } from 'src/common/enums/report-status';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportTarget } from './../../common/enums/report-status';
@Entity() //? 배너광고 형태로 보여줄 콘텐츠
export class Report extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({
    type: 'enum',
    enum: ReportTarget,
    default: ReportTarget.USER,
  })
  target: ReportTarget;

  @Column({ type: 'int', unsigned: true })
  targetId: number;

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
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.reports, {
    onDelete: 'SET NULL',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Report>) {
  //   Object.assign(this, partial);
  // }
}
