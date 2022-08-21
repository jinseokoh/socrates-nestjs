import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ArtworkCategory,
  Availability,
  Framing,
  Orientation,
  Size,
} from 'src/common/enums';
import { Color } from 'src/common/enums/color';
export class CreateArtworkDto {
  @ApiProperty({ description: '제목 🔍' })
  @IsString()
  title: string;

  @ApiProperty({ description: '부제목 🔍' })
  @IsString()
  subtitle: string;

  @ApiProperty({ description: '설명 🔍' })
  @IsString()
  body?: string | null;

  @ApiProperty({ description: '작품소재 🔍' })
  @IsString()
  @IsOptional()
  medium?: string | null;

  @ApiProperty({ description: '이미지들 (String[])', required: false })
  @IsArray()
  @IsOptional()
  images?: string[] | null;

  @ApiProperty({ description: '판매가 💡', required: false })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiProperty({ description: '가로크기 (mm)', required: false })
  @IsNumber()
  @IsOptional()
  height?: number | null;

  @ApiProperty({ description: '세로크기 (mm)', required: false })
  @IsNumber()
  @IsOptional()
  width?: number | null;

  @ApiProperty({ description: '작품호수', required: false })
  @IsString()
  @IsOptional()
  canvasSize?: string | null;

  @ApiProperty({
    description: '분류',
    required: false,
    default: ArtworkCategory.OTHER,
  })
  @IsEnum(ArtworkCategory)
  @IsOptional()
  category?: ArtworkCategory;

  @ApiProperty({
    description: '판매가능상태 💡',
    required: false,
    default: Availability.UNKNOWN,
  })
  @IsEnum(Availability)
  @IsOptional()
  availability?: Availability;

  @ApiProperty({
    description: '작품방향 💡',
    required: false,
    default: Orientation.LANDSCAPE,
  })
  @IsEnum(Orientation)
  @IsOptional()
  orientation?: Orientation;

  @ApiProperty({
    description: '프레임여부 💡',
    required: false,
    default: Framing.FRAMED,
  })
  @IsEnum(Framing)
  @IsOptional()
  framing?: Framing;

  @ApiProperty({
    description: '색상 💡',
    required: false,
    default: Color.BLACK,
  })
  @IsEnum(Color)
  @IsOptional()
  color?: Color;

  @ApiProperty({ description: '작품크기 💡', required: false, default: Size.S })
  @IsEnum(Size)
  @IsOptional()
  size?: Size;

  @ApiProperty({ description: '제작년도', required: false })
  @IsString()
  @IsOptional()
  producedIn?: string | null;

  @ApiProperty({ description: '미공개 메모', required: false })
  @IsString()
  @IsOptional()
  note?: string | null;

  @ApiProperty({ description: '작가 아이디' })
  @IsNumber()
  artistId: number;

  @ApiProperty({ description: '리셀러(유저) 아이디' })
  @IsNumber()
  ownerId: number;
}
