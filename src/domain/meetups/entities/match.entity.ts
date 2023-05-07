import { ApiProperty } from '@nestjs/swagger';
import { Status } from 'src/common/enums/status';
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
export class Match {
  @Column({ type: 'enum', enum: Status, nullable: true })
  @ApiProperty({ description: 'ACCEPTED|DENIED' })
  status: Status;

  @Column({ length: 36, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  askingUserId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'askingUserId' })
  public askingUser!: User;

  @PrimaryColumn({ type: 'int', unsigned: true })
  askedUserId: number | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'askedUserId' })
  public askedUser!: User;

  @PrimaryColumn({ type: 'bigint' })
  public meetupId!: number;
  @ManyToOne(() => Meetup, (meetup) => meetup.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;
}
