import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class LanguageSkillDto {
  @ApiProperty({ description: 'language skill items', required: true })
  @Type(() => Array<LanguageSkillItemDto>)
  @IsArray()
  languages: Array<LanguageSkillItemDto>;
}

export class LanguageSkillItemDto {
  @ApiProperty({ description: 'language 아이디' })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({ description: 'language 아이디', required: true })
  @IsNumber()
  languageId: number;

  @ApiProperty({ description: 'language fluency', required: true })
  @IsNumber()
  skill: number;
}
