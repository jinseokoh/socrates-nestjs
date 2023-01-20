import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Category } from 'src/common/enums/category';
import { User } from 'src/domain/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity() // 작품
export class Survey extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: '질문' })
  question: string;

  @Column('json', { nullable: false })
  @ApiProperty({ description: '답변' })
  answers: string[];

  @Column({ default: false })
  isApproved: boolean;

  @Column({
    type: 'enum',
    enum: Category,
    default: Category.FOOD,
  })
  @ApiProperty({ description: 'category' })
  category: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.surveys, {
    onDelete: 'SET NULL',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Survey>) {
  //   Object.assign(this, partial);
  // }
}
