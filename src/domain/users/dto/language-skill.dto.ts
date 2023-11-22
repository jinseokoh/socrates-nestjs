import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray } from 'class-validator';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';

export class LanguageSkillDto {
  @ApiProperty({ description: 'array of LanguageSkills', required: true })
  @Transform(({ value }) => value)
  @IsArray()
  skills: Array<LanguageSkill>;
}
