import { ApiProperty } from '@nestjs/swagger';
import { ReportConnection } from 'src/domain/connections/entities/report_connection.entity';
import { Dot } from 'src/domain/connections/entities/dot.entity';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';
import { Remark } from 'src/domain/connections/entities/remark.entity';
import { Inquiry } from 'src/domain/inquiries/entities/inquiry.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_dot_id_key', ['userId', 'dotId'])
export class Connection {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'text', nullable: false })
  @ApiProperty({ description: '사용자 답변' })
  answer: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  remarkCount: number; // 신고

  @Column({ type: 'int', unsigned: true, default: 0 })
  reportCount: number; // 신고

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'sympatheticCount' })
  sympatheticCount: number; // 감정) reaction #1

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'laughterCount' })
  humorousCount: number; // 감정) reaction #2

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'surpriseCount' })
  surprisedCount: number; // 감정) reaction #3

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'sadCount' })
  sadCount: number; // 감정) reaction #4

  @Column({ type: 'int', unsigned: true, default: 0 })
  disgustCount: number; // 감정) reaction #5

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  //*-------------------------------------------------------------------------*/
  //* 1-to-many hasMany

  @OneToMany(() => Remark, (remark) => remark.connection, {
    // cascade: ['insert', 'update'],
  })
  remarks: Remark[];

  @OneToMany(
    () => ReportConnection,
    (ReportConnection) => ReportConnection.connection,
  )
  public userReports: ReportConnection[];

  @OneToMany(() => Reaction, (reaction) => reaction.connection)
  public userReactions: Reaction[];

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @ManyToOne(() => User, (user) => user.connections)
  public user: User;

  @Column({ type: 'int', unsigned: true })
  public dotId: number;

  @ManyToOne(() => Dot, (dot) => dot.connections)
  public dot: Dot;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Inquiry, (inquiry) => inquiry.flaggedConnections)
  flaggedInquiries: Inquiry[];
}
