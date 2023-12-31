import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// user can hate other user
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Hate {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public senderId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public recipientId: number;

  @Column({ length: 32, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.usersHating)
  public sender: User;

  @ManyToOne(() => User, (user) => user.usersHated)
  public recipient: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Hate>) {
    Object.assign(this, partial);
  }
}
