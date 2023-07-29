import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// user can hate other user
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Hate {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public hatingId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public hatedId: number;

  @Column({ length: 16, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.usersHating)
  public hating: User;

  @ManyToOne(() => User, (user) => user.usersHated)
  public hated: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Hate>) {
    Object.assign(this, partial);
  }
}
