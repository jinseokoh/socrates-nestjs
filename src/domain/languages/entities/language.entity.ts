import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Language {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 32 })
  slug: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  userCount: number;

  //*-------------------------------------------------------------------------*/
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => LanguageSkill, (languageSkill) => languageSkill.language)
  public usersSkilled: LanguageSkill[];

  // used to have this many to many relationship.
  // @ManyToMany(() => User, (user) => user.languages)
  // users: User[];
  //?-------------------------------------------------------------------------?/
  //? constructor

  constructor(partial: Partial<Language>) {
    Object.assign(this, partial);
  }
}
