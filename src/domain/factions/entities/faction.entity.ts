import { ApiProperty } from '@nestjs/swagger';
import { Dot } from 'src/domain/dots/entities/dot.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Faction {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ length: 6, nullable: false })
  @ApiProperty({
    description: 'age group name',
  })
  name: string;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  minAge: number; // to make it available to Repository.

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  maxAge: number; // to make it available to Repository.

  @ManyToMany(() => Dot, (dot) => dot.factions)
  dots: Dot[];
}
