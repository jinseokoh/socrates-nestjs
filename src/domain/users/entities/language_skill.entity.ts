import { ApiProperty } from '@nestjs/swagger';
import { Language } from 'src/domain/languages/entities/language.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class LanguageSkill {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public languageId: number;

  @Column({ type: 'tinyint', unsigned: true })
  skill: number;

  @ManyToOne(() => User, (user) => user.languageSkills)
  public user?: User | null;

  @ManyToOne(() => Language, (language) => language.usersSkilled)
  public language?: Language | null;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<LanguageSkill>) {
    Object.assign(this, partial);
  }
}
