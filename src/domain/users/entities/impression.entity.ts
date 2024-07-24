import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
@Unique('user_id_recipient_id_key', ['userId', 'recipientId'])
export class Impression {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  recipientId: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  @ApiProperty({ description: '🥰 관심 🥱 무관심' })
  empathy: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  @ApiProperty({ description: '😎 자신감 🫣 열등감' })
  confidence: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  @ApiProperty({ description: '😝 유머러스 🥶 유머코드다름' })
  humor: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  @ApiProperty({ description: '🤠 매너 😬 비매너' })
  manner: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  @ApiProperty({ description: '😀 긍정적 😱 부정적' })
  attitude: number;

  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  @ApiProperty({ description: '😀 적절한 😡 부적절한' })
  inappropriateness: number;

  @Column({ length: 80, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @ManyToOne(() => User, (user) => user.sentImpressions, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => User, (user) => user.receivedImpressions, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public recipient: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Impression>) {
    Object.assign(this, partial);
  }
}
