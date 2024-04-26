import { ApiProperty } from '@nestjs/swagger';
import { JoinStatus, JoinType } from 'src/common/enums';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
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
export class Join {
  @Column({ type: 'enum', enum: JoinStatus, nullable: true })
  @ApiProperty({ description: 'ACCEPTED|DENIED' })
  status: JoinStatus;

  @Column({ type: 'enum', enum: JoinType, default: JoinType.REQUEST })
  @ApiProperty({ description: 'INVITATION|REQUEST' })
  joinType: JoinType;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  @ApiProperty({ description: 'skill level' })
  skill: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  askingUserId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.askingJoins, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'askingUserId' })
  public askingUser!: User;

  @PrimaryColumn({ type: 'int', unsigned: true })
  askedUserId: number | null; // to make it available to Repository.

  @PrimaryColumn({ type: 'int', unsigned: true })
  public meetupId!: number;

  //? -------------------------------------------------------------------------/
  //? many-to-many belongsToMany using many-to-one

  @ManyToOne(() => User, (user) => user.askedJoins, { cascade: true })
  @JoinColumn({ name: 'askedUserId' })
  public askedUser!: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.id, { cascade: true })
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;

  //? -------------------------------------------------------------------------/
  //? constructor

  constructor(partial: Partial<Join>) {
    Object.assign(this, partial);
  }
}
