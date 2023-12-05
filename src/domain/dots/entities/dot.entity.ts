import { ApiProperty } from '@nestjs/swagger';
import { Connection } from 'src/domain/users/entities/connection.entity';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Dot {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  slug: string;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'question' })
  question: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  votes: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  answers: number;

  @Column({ default: false })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => Connection, (connection) => connection.dot)
  public connectedUsers: Connection[];

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany

  // @ManyToMany(() => Meetup, (meetup) => meetup.categories)
  // meetups: Meetup[];

  // used to have this many to many relationship.
  // @ManyToMany(() => User, (user) => user.categories)
  // users: User[];
  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Dot>) {
    Object.assign(this, partial);
  }
}
