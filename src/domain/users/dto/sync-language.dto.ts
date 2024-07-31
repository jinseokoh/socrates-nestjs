import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { LanguageSkill } from 'src/domain/users/entities/language_skill.entity';

export type LanguageSkillWithoutId = Omit<LanguageSkill, 'id'>;
export class SyncLanguageDto {
  @ApiProperty({ description: 'ids', required: false })
  @IsArray()
  @IsOptional()
  ids?: number[] | null;

  @ApiProperty({ description: 'slugs', required: false })
  @IsArray()
  @IsOptional()
  slugs?: string[] | null;

  @ApiProperty({ description: 'LanguageSkills', required: false })
  @IsArray()
  @IsOptional()
  entities?: LanguageSkillWithoutId[];
}
