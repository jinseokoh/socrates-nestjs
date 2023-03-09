import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateVenueDto {
  @ApiProperty({ description: '장소명', required: true })
  @IsString()
  name: string;

  @ApiProperty({ description: '주소', required: false })
  @IsString()
  address?: string | null;

  @ApiProperty({ description: 'hashtags', required: true })
  @IsString()
  @IsOptional()
  tags?: string | null;

  @ApiProperty({ description: 'city', required: true })
  @IsString()
  city: string;

  @ApiProperty({ description: 'state', required: true })
  @IsString()
  state: string;

  @ApiProperty({ description: '위도', required: true })
  @IsNumber()
  latitude: number; // y as number

  @ApiProperty({ description: '경도', required: true })
  @IsNumber()
  longitude: number; // x as number

  @ApiProperty({ description: '네이버 장소ID', required: true })
  @IsString()
  @IsOptional()
  providerId?: string; // id as id

  @ApiProperty({ description: 'Meetup ID', required: true })
  @IsString()
  @IsOptional()
  meetupId?: string; // id as id
}
