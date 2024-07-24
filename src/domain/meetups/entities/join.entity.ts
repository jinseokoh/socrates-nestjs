import { ApiProperty } from '@nestjs/swagger';
import { JoinStatus, JoinRequestType } from 'src/common/enums';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_recipient_id_meetup_id_key', [
  'userId',
  'recipientId',
  'meetupId',
])
export class Join {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  userId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true })
  recipientId: number | null; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true })
  meetupId!: number;

  @Column({ length: 80, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  @ApiProperty({ description: 'skill level' })
  skill: number;

  @Column({
    type: 'enum',
    enum: JoinRequestType,
    default: JoinRequestType.REQUEST,
  })
  @ApiProperty({ description: 'invitation|request' })
  joinType: JoinRequestType;

  @Column({ type: 'enum', enum: JoinStatus, nullable: true })
  @ApiProperty({ description: 'pending|accepted|denied' })
  status: JoinStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sentJoins, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  public user!: User;

  //? -------------------------------------------------------------------------/
  //? many-to-many belongsToMany using many-to-one

  @ManyToOne(() => User, (user) => user.receivedJoins, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;

  //? -------------------------------------------------------------------------/
  //? constructor

  constructor(partial: Partial<Join>) {
    Object.assign(this, partial);
  }
}
