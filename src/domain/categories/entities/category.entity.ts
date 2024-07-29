import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { Interest } from 'src/domain/users/entities/interest.entity';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';

@Entity()
@Tree('nested-set')
export class Category {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64 })
  slug: string;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  depth: number;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  //? ----------------------------------------------------------------------- //
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => Interest, (interest) => interest.category)
  public usersInterested: Interest[];

  //? ----------------------------------------------------------------------- //
  //* many-to-many belongsToMany

  @ManyToMany(() => Meetup, (meetup) => meetup.categories)
  meetups: Meetup[];

  // used to have this many to many relationship.
  // @ManyToMany(() => User, (user) => user.categories)
  // users: User[];
  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Category>) {
    Object.assign(this, partial);
  }
}
