import { Connection } from 'src/domain/dots/entities/connection.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can abhor connection
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Abhor {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public connectionId: number;

  @Column({ length: 32, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.connectionsAbhorred)
  public user: User;

  @ManyToOne(() => Connection, (connection) => connection.usersAbhorred)
  public connection: Connection;
}
