import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// user can hate other user
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Hate {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public hatingUserId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public hatedUserId: number;

  @Column({ length: 32, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.usersHating)
  public hatingUser: User;

  @ManyToOne(() => User, (user) => user.usersHated)
  public hatedUser: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Hate>) {
    Object.assign(this, partial);
  }
}
