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

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  skill: number | null;

  @ManyToOne(() => User, (user) => user.languageSkills)
  public user: User;

  @ManyToOne(() => Language, (language) => language.usersSkilled)
  public language: Language;
}
