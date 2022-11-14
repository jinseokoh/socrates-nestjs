import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { GameCategory } from 'src/common/enums/game-category';
import { User } from 'src/domain/users/user.entity';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity() // 작품
export class Survey extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  @ApiProperty({ description: 'id' })
  id: number;

  @Column({ length: 128 })
  @ApiProperty({ description: '질문' })
  question: string;

  @Column('json', { nullable: true })
  @ApiProperty({ description: '답변' })
  images: string[] | null;

  @Column({
    type: 'enum',
    enum: GameCategory,
    default: GameCategory.FOOD,
  })
  @ApiProperty({ description: 'category' })
  category: GameCategory;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'int', unsigned: true, nullable: true })
  userId: number | null; // to make it available to Repository.
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
