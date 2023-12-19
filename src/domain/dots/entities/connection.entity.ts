import { ApiProperty } from '@nestjs/swagger';
import { Abhor } from 'src/domain/dots/entities/abhor.entity';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Remark } from 'src/domain/dots/entities/remark.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
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
  fontCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  abhorCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  explicitCount: number;

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

  @OneToMany(() => Abhor, (abhor) => abhor.connection)
  public usersAbhorred: Abhor[];

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
}
