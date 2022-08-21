import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class CreateHashtagDto {
  @ApiProperty({ description: '이름 🔍' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'slug' })
  @IsString()
  slug: string;
}
