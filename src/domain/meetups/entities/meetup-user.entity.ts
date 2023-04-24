import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Status } from 'src/common/enums/status';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Exclude()
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.meetupUsers)
  public user!: User;

  @Exclude()
  @PrimaryColumn({ type: 'uuid', length: 36 })
  public meetupId!: string;

  @ManyToOne(() => Meetup, (meetup) => meetup.meetupUsers)
  public meetup!: Meetup;
}
