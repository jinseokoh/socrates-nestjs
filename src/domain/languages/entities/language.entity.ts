import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Language {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 32 })
  slug: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  userCount: number;

  //? ----------------------------------------------------------------------- //
  //* many-to-many belongsToMany using one-to-many

  @OneToMany(() => LanguageSkill, (languageSkill) => languageSkill.language)
  public usersSkilled: LanguageSkill[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Language>) {
    Object.assign(this, partial);
  }
}
