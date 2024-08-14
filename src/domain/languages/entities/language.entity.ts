import { Fluency } from 'src/domain/languages/entities/fluency.entity';
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

  @OneToMany(() => Fluency, (languageSkill) => languageSkill.language)
  public usersSkilled: Fluency[];

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Language>) {
    Object.assign(this, partial);
  }
}
