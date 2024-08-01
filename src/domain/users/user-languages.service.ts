import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { In, Repository } from 'typeorm';
import { User } from 'src/domain/users/entities/user.entity';
import { Language } from 'src/domain/languages/entities/language.entity';
import { LanguageSkillWithoutId } from 'src/domain/users/dto/sync-language.dto';

@Injectable()
export class UserLanguagesService {
  private readonly env: any;
  private readonly logger = new Logger(UserLanguagesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(LanguageSkill)
    private readonly languageSkillRepository: Repository<LanguageSkill>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 언어 (languages) 리스트
  //? ----------------------------------------------------------------------- //

  async loadMyLanguages(userId: number): Promise<LanguageSkill[]> {
    const user = await this.userRepository.findOneOrFail({
      where: {
        id: userId,
      },
      relations: ['languageSkills', 'languageSkills.language'],
    });

    return user.languageSkills;
  }

  //? ----------------------------------------------------------------------- //
  //? 관심사 Sync w/ Ids (기존정보 사라짐) skill 기본 값 0 으로 저장
  //? ----------------------------------------------------------------------- //

  async syncLanguagesWithIds(
    userId: number,
    ids: number[],
  ): Promise<LanguageSkill[]> {
    await this._wipeOutLanguageSkills(userId);
    await Promise.all(
      ids.map(async (v: number) => {
        await this.languageRepository.manager.query(
          'INSERT IGNORE INTO `language_skill` (userId, languageId) VALUES (?, ?)',
          [userId, v],
        );
      }),
    );
    return await this.loadMyLanguages(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 언어 Sync w/ Slugs (기존정보 사라짐) skill 기본 값 0 으로 저장
  //? ----------------------------------------------------------------------- //

  async syncLanguagesWithSlugs(
    userId: number,
    slugs: string[],
  ): Promise<LanguageSkill[]> {
    await this._wipeOutLanguageSkills(userId);
    const languages = await this.languageRepository.findBy({
      slug: In(slugs),
    });
    const slugIds = languages.map((v) => v.id);
    await Promise.all(
      slugIds.map(async (v: number) => {
        await this.languageRepository.manager.query(
          'INSERT IGNORE INTO `language_skill` (userId, languageId) VALUES (?, ?)',
          [userId, v],
        );
      }),
    );

    return await this.loadMyLanguages(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 언어 Sync w/ LanguageSkills (기존정보 사라짐)
  //? ----------------------------------------------------------------------- //

  async syncLanguagesWithEntities(
    userId: number,
    entities: LanguageSkillWithoutId[],
  ): Promise<LanguageSkill[]> {
    await this._wipeOutLanguageSkills(userId);
    await this.languageSkillRepository.upsert(entities, [
      `userId`,
      `languageId`,
    ]);

    return await this.loadMyLanguages(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? 언어 Upsert w/ Skill
  //? ----------------------------------------------------------------------- //

  async upsertLanguageWithSkill(
    userId: number,
    slug: string,
    skill: number,
  ): Promise<LanguageSkill[]> {
    try {
      const language = await this.languageRepository.findOneBy({
        slug: slug,
      });
      if (language !== null) {
        await this.languageSkillRepository.manager.query(
          'INSERT IGNORE INTO `language_skill` \
    (userId, languageId, skill) VALUES (?, ?, ?) \
    ON DUPLICATE KEY UPDATE \
    userId = VALUES(`userId`), \
    languageId = VALUES(`languageId`), \
    skill = VALUES(`skill`)',
          [userId, language.id, skill],
        );
      }

      return await this.loadMyLanguages(userId);
    } catch (e) {
      throw new NotFoundException('language not found');
    }
  }

  //? ----------------------------------------------------------------------- //
  //? 언어 삭제
  //? ----------------------------------------------------------------------- //

  async removeLanguages(
    userId: number,
    ids: number[],
  ): Promise<Array<LanguageSkill>> {
    const { affectedRows } = await this.languageRepository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ? AND languageId IN (?)',
      [userId, ids],
    );

    return await this.loadMyLanguages(userId);
  }

  //? ----------------------------------------------------------------------- //
  //? privates
  //? ----------------------------------------------------------------------- //

  async _wipeOutLanguageSkills(userId: number): Promise<void> {
    await this.languageRepository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ?',
      [userId],
    );
  }
}
