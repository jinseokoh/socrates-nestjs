import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  Category,
  Region,
  SubCategory,
  TargetCareerType,
} from 'src/common/enums';
import { Day } from 'src/common/enums/day';
import { Expense } from 'src/common/enums/expense';
import { TargetGender } from 'src/common/enums/gender';
import { Time } from 'src/common/enums/time';
import { CreateVenueDto } from 'src/domain/venues/dto/create-venue.dto';
export class CreateMeetupDto {
  @ApiProperty({ description: 'category', default: Category.CHALLENGE })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({
    description: 'subCategory',
    default: SubCategory.OTHER_CHALLENGE,
  })
  @IsEnum(SubCategory)
  subCategory: SubCategory;

  @ApiProperty({ description: '기술/레벨', required: true })
  @Type(() => Number)
  @IsNumber()
  skill: number;

  @ApiProperty({ description: '제목', required: true })
  @IsString()
  title: string;

  @ApiProperty({ description: '설명', required: true })
  @IsString()
  description: string;

  @ApiProperty({ description: '이미지들 (string[])', required: true })
  @IsArray()
  images: string[];

  @ApiProperty({ description: '상대 성별', default: TargetGender.ALL })
  @IsEnum(TargetGender)
  @IsOptional()
  targetGender: TargetGender;

  @ApiProperty({ description: '상대방 나이 min', default: 18 })
  @IsString()
  @IsOptional()
  targetMinAge: number;

  @ApiProperty({ description: '상대방 나이 max', default: 66 })
  @IsString()
  @IsOptional()
  targetMaxAge: number;

  @ApiProperty({ description: '상대방 careers', default: ['all'] })
  @IsArray()
  @IsOptional()
  targetCareers: TargetCareerType[];

  @ApiProperty({ description: 'CreateVenueDto' })
  @ValidateNested()
  @Type(() => CreateVenueDto)
  venue: CreateVenueDto;

  @ApiProperty({ description: 'region', default: Region.SEOUL })
  @IsEnum(Region)
  region: Region;

  @ApiProperty({ description: '장소에 대한 경험치', required: true })
  @Type(() => Number)
  @IsNumber()
  patron: number;

  @ApiProperty({ description: 'max 인원', required: true })
  @Type(() => Number)
  @IsNumber()
  max: number;

  @ApiProperty({ description: '비용', required: true })
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ description: '비용 details', default: [] })
  @IsArray()
  @IsOptional()
  expenses: Expense[];

  @ApiProperty({ description: '원하는 요일', default: Day.ANYDAY })
  @IsEnum(Day)
  day: Day;

  @ApiProperty({ description: '원하는 시간대', default: [] })
  @IsArray()
  @IsOptional()
  times: Time[];

  @ApiProperty({ description: 'like count', default: 0 })
  @IsNumber()
  @IsOptional()
  joinCount: number;

  @ApiProperty({ description: 'like count', default: 0 })
  @IsNumber()
  @IsOptional()
  likeCount: number;

  @ApiProperty({ description: 'report count', default: 0 })
  @IsNumber()
  @IsOptional()
  reportCount: number;

  @ApiProperty({ description: 'view count', default: 0 })
  @IsNumber()
  @IsOptional()
  viewCount: number;

  @ApiProperty({ description: '게시판 여부', default: false })
  @IsBoolean()
  @IsOptional()
  hasQa: boolean;

  @ApiProperty({ description: '빈자리 여부', default: false })
  @IsBoolean()
  @IsOptional()
  isFull: boolean;

  @ApiProperty({ description: '신고여부', default: false })
  @IsBoolean()
  @IsOptional()
  isFlagged: boolean;

  @ApiProperty({ description: '종료시각' })
  @Type(() => Date)
  @IsDate()
  expiredAt: Date;

  @ApiProperty({ description: '생성시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  createdAt?: Date | null;

  @ApiProperty({ description: '수정시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  updatedAt?: Date | null;

  @ApiProperty({ description: '삭제시각 (ISO8601)' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deletedAt?: Date | null;

  @ApiProperty({ description: 'User 아이디' })
  @IsNumber()
  @IsOptional()
  userId?: number;

  // @ApiProperty({ description: 'Venue 아이디' })
  // @IsString()
  // @IsOptional()
  // venueId?: string;
}
