import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';

@Entity()
@Tree('nested-set')
export class Region {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 64 })
  slug: string;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  depth: number;

  @TreeChildren()
  children: Region[];

  @TreeParent()
  parent: Region;

  //**--------------------------------------------------------------------------*/
  //** many-to-many belongsToMany

  @ManyToMany(() => Meetup, (meetup) => meetup.regions)
  meetups: Meetup[];
}
