import {
  Column,
  Entity,
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

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  // @ManyToMany(() => Meetup, (meetup) => meetup.categories)
  // meetups: Meetup[];
}
