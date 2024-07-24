import { ApiProperty } from '@nestjs/swagger';
import { Category } from 'src/domain/categories/entities/category.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_category_id_key', ['userId', 'categoryId'])
export class Interest {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @Column({ type: 'int', unsigned: true })
  public categoryId: number;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  @ApiProperty({ description: '취미/관심사 능숙도' })
  skill: number | null;

  @ManyToOne(() => User, (user) => user.categoriesInterested, {
    cascade: true,
  })
  public user: User;

  @ManyToOne(() => Category, (category) => category.usersInterested, {
    cascade: true,
  })
  public category: Category;
}
