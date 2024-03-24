import { Dot } from 'src/domain/dots/entities/dot.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Choice {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public dotId: number;

  @Column({ type: 'tinyint', unsigned: true })
  answer: number;

  @ManyToOne(() => User, (user) => user.choices)
  public user: User;

  @ManyToOne(() => Dot, (dot) => dot.choices)
  public dot: Dot;
}
