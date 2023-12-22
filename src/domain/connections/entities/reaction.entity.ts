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

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'sympathyCount' })
  sympathyCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'laughterCount' })
  laughterCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'surpriseCount' })
  surpriseCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'disappointedCount' })
  disappointedCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'explicitCount' })
  explicitCount: number;

  @ManyToOne(() => User, (user) => user.connectionsReacted)
  public user: User;

  @ManyToOne(() => Connection, (connection) => connection.usersReacted)
  public connection: Connection;
}
