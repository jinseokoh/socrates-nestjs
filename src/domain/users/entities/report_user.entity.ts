import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
@Entity()
export class ReportUser {
  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number; // to make it available to Repository.

  @PrimaryColumn({ type: 'int', unsigned: true })
  public accusedUserId: number; // to make it available to Repository.

  @Column({ length: 32, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.accusingReports, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  public user!: User;

  @ManyToOne(() => User, (user) => user.accusedReports, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'accusedUserId' })
  public accusedUser!: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Report>) {
    Object.assign(this, partial);
  }
}
