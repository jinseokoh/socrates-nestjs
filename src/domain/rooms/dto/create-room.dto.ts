import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { RateEnum } from 'src/common/enums';
export class CreateRoomDto {
  @ApiProperty({ description: '제목', required: true })
  @IsString()
  title: string;

  @ApiProperty({ description: '성별', default: 'F' })
  @IsString()
  genderWanted: string;

  @ApiProperty({
    description: 'rate',
    default: RateEnum.NSFW,
  })
  @IsEnum(RateEnum)
  rate: RateEnum;

  @ApiProperty({ description: '사용자 아이디' })
  @IsNumber()
  @IsOptional()
  hostId: number | null;
}
