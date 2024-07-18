import { ApiProperty } from '@nestjs/swagger';
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

//? 댓글 comment, thread, opinion, comment 신고
@Entity()
export class Flag {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64, nullable: false })
  message: string;

  @Column({ length: 32, nullable: false })
  entity: string;

  @Column({ type: 'int', unsigned: false })
  entityId: number;

  @Column({ length: 128, nullable: true })
  note: string | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ description: 'deletedAt' })
  deletedAt: Date | null;

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  //? -------------------------------------------------------------------------/
  //? many-to-one belongsTo

  @ManyToOne(() => User, (user) => user.flags, {
    onDelete: 'CASCADE',
  })
  user?: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Flag>) {
    Object.assign(this, partial);
  }
}
