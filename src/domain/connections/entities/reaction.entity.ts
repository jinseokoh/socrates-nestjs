import { ApiProperty } from '@nestjs/swagger';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can like connection
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Reaction {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public connectionId: number;

  @Column({ default: false })
  sympathetic: boolean;

  @Column({ default: false })
  surprised: boolean;

  @Column({ default: false })
  humorous: boolean;

  @Column({ default: false })
  sad: boolean;

  @Column({ default: false })
  disgust: boolean;

  @ManyToOne(() => User, (user) => user.connectionsReacted)
  public user: User;

  @ManyToOne(() => Connection, (connection) => connection.usersReacted)
  public connection: Connection;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Reaction>) {
    Object.assign(this, partial);
  }
}
