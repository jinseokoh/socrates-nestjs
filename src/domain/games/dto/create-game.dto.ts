import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Rate } from 'src/common/enums/rate';
export class CreateGameDto {
  @ApiProperty({ description: '제목', required: true })
  @IsString()
  title: string;

  @ApiProperty({ description: '성별', default: 'F' })
  @IsString()
  genderWanted: string;

  @ApiProperty({
    description: 'rate',
    default: Rate.NSFW,
  })
  @IsEnum(Rate)
  rate: Rate;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  userId: number | null;
}
