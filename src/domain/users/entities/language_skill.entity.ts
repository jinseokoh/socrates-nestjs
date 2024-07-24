import { ApiProperty } from '@nestjs/swagger';
import { Language } from 'src/domain/languages/entities/language.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// a user can like meetup
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_language_id_key', ['userId', 'languageId'])
export class LanguageSkill {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true })
  public userId: number;

  @Column({ type: 'int', unsigned: true })
  public languageId: number;

  @Column({ type: 'tinyint', unsigned: true })
  @ApiProperty({ description: '능숙도' })
  skill: number;

  @ManyToOne(() => User, (user) => user.languageSkills, { cascade: true })
  public user?: User | null;

  @ManyToOne(() => Language, (language) => language.usersSkilled, {
    cascade: true,
  })
  public language?: Language | null;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<LanguageSkill>) {
    Object.assign(this, partial);
  }
}
