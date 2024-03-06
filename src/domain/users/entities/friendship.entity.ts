import { ApiProperty } from '@nestjs/swagger';
import { FriendshipStatus, RequestFrom } from 'src/common/enums';
import { Plea } from 'src/domain/users/entities/plea.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Friendship {
  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.NILL,
  })
  @ApiProperty({ description: 'ACCEPTED|PENDING|NILL' })
  status: FriendshipStatus;

  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'message' })
  message: string | null;

  @Column({
    type: 'enum',
    enum: RequestFrom,
    default: RequestFrom.CONNECTION,
  })
  @ApiProperty({ description: 'connection|profile|plea' })
  requestFrom: RequestFrom;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @PrimaryColumn({ type: 'int', unsigned: true })
  senderId: number; // to make it available to Repository.

  @PrimaryColumn({ type: 'int', unsigned: true })
  recipientId: number; // to make it available to Repository.

  @Column({ type: 'int', unsigned: true, default: null })
  pleaId: number | null; // to make it available to Repository.

  //? -------------------------------------------------------------------------/
  //? many-to-many belongsToMany using many-to-one

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'senderId' })
  public sender!: User;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'recipientId' })
  public recipient!: User;

  @OneToOne(() => Plea, (plea) => plea.id, {
    nullable: true,
  })
  @JoinColumn({ name: 'pleaId' })
  public plea: Plea;

  //? -------------------------------------------------------------------------/
  //? constructor

  constructor(partial: Partial<Friendship>) {
    Object.assign(this, partial);
  }
}
