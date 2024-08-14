import { ApiProperty } from '@nestjs/swagger';
import { Language } from 'src/domain/languages/entities/language.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn, Unique } from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Fluency {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public languageId: number;

  @Column({ type: 'tinyint', unsigned: true })
  @ApiProperty({ description: '언어 능숙도' })
  skill: number;

  @ManyToOne(() => User, (user) => user.languageSkills, { cascade: true })
  public user?: User | null;

  @ManyToOne(() => Language, (language) => language.usersSkilled, {
    cascade: true,
  })
  public language?: Language | null;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Fluency>) {
    Object.assign(this, partial);
  }
}
