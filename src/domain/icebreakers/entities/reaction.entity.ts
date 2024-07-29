import { Answer } from 'src/domain/icebreakers/entities/answer.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can like answer
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Reaction {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public answerId: number;

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

  @ManyToOne(() => User, (user) => user.answersReacted)
  public user: User;

  @ManyToOne(() => Answer, (answer) => answer.userReactions)
  public answer: Answer;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Reaction>) {
    Object.assign(this, partial);
  }
}
