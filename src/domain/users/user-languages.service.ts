import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UserLanguagesService {
  private readonly env: any;
  private readonly logger = new Logger(UserLanguagesService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(LanguageSkill)
    private readonly languageSkillRepository: Repository<LanguageSkill>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? 언어 LanguageSkills
  //?-------------------------------------------------------------------------//

  // 사용자 언어 리스트
  async getLanguageSkills(userId: number): Promise<Array<LanguageSkill>> {
    const user = await this.repository.findOneOrFail({
      where: {
        id: userId,
      },
      relations: ['languageSkills', 'languageSkills.language'],
    });

    return user.languageSkills;
  }

  // 나의 언어 리스트 UPSERT
  async upsertLanguageSkills(
    userId: number,
    items: Array<LanguageSkill>,
  ): Promise<Array<LanguageSkill>> {
    await this.repository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ?',
      [userId],
    );

    await this.languageSkillRepository.upsert(items, [`userId`, `languageId`]);

    return await this.getLanguageSkills(userId);
  }

  // 나의 언어 리스트에서 삭제
  async removeLanguages(
    userId: number,
    ids: number[],
  ): Promise<Array<LanguageSkill>> {
    // const user = await this.findById(id, ['categories']);
    await this.repository.manager.query(
      'DELETE FROM `language_skill` WHERE userId = ? AND languageId IN (?)',
      [userId, ids],
    );

    return await this.getLanguageSkills(userId);
  }
}
