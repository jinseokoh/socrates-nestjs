import { Category } from 'src/domain/categories/entities/category.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Interest {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public categoryId: number;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  skill: number | null;

  @ManyToOne(() => User, (user) => user.categoriesInteresting)
  public user: User;

  @ManyToOne(() => Category, (category) => category.usersInterested)
  public category: Category;
}
