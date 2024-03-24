import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePollDto {
  @ApiProperty({ description: 'title' })
  @IsString()
  title: string; // category slug

  @ApiProperty({ description: 'quesiton' })
  @IsString()
  help: string;

  @ApiProperty({ description: 'options', required: true })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiProperty({ description: 'answers', required: false })
  @IsArray()
  @IsOptional()
  answers?: number[];

  @ApiProperty({
    description: '복수 선택 가능',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  allowDups?: boolean;
}
