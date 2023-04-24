import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Status } from 'src/common/enums/status';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class MeetupUser {
  @Exclude()
  @Column({ nullable: true })
  public acked: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: Status,
    default: Status.FAVE,
  })
  @ApiProperty({ description: 'FAVE|MATCH' })
  status: Status;

  // @Index('created-at-index')
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number | null; // to make it available to Repository.

  @Exclude()
  @PrimaryColumn({ type: 'uuid', length: 36 })
  public meetupId!: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  public user!: User;

  @ManyToOne(() => Meetup, (meetup) => meetup.id)
  @JoinColumn({ name: 'meetupId' })
  public meetup!: Meetup;
}
