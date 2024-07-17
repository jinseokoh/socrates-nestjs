import { Connection } from 'src/domain/dots/entities/connection.entity';
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
  sympathy: boolean;

  @Column({ default: false })
  smile: boolean;

  @Column({ default: false })
  surprise: boolean;

  @Column({ default: false })
  sorry: boolean;

  @Column({ default: false })
  uneasy: boolean;

  @ManyToOne(() => User, (user) => user.connectionsReacted)
  public user: User;

  @ManyToOne(() => Connection, (connection) => connection.userReactions)
  public connection: Connection;

  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Reaction>) {
    Object.assign(this, partial);
  }
}
