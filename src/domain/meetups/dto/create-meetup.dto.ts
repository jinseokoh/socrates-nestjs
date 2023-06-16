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
import { Category, Region, SubCategory } from 'src/common/enums';
import { Career } from 'src/common/enums/career';
import { Day } from 'src/common/enums/day';
import { Expense } from 'src/common/enums/expense';
import { Gender } from 'src/common/enums/gender';
import { Time } from 'src/common/enums/time';
import { CreateVenueDto } from 'src/domain/venues/dto/create-venue.dto';
export class CreateMeetupDto {
  @ApiProperty({ description: '제목', required: true })
  @IsString()
  title: string;

  @ApiProperty({ description: '설명', required: true })
  @IsString()
  description: string;

  @ApiProperty({ description: '이미지들 (String[])', required: true })
  @IsArray()
  images: string[];

  @ApiProperty({ description: 'category', default: Category.LEISURE })
  @IsEnum(Category)
  category: Category;

  @ApiProperty({
    description: 'subCategory',
    default: SubCategory.OTHER_LEISURE,
  })
  @IsEnum(SubCategory)
  subCategory: SubCategory;

  @ApiProperty({ description: '노출하는 성별', required: false })
  @IsEnum(Gender)
  @IsOptional()
  targetGender: Gender | null;

  @ApiProperty({ description: '노출하는 career', default: 'all' })
  @IsString()
  @IsOptional()
  targetCareers: string;

  @ApiProperty({ description: 'region', default: Region.SEOUL })
  @IsEnum(Region)
  region: Region;

  @ApiProperty({ description: '요일', default: Day.ANYDAY })
  @IsEnum(Day)
  day: Day;

  @ApiProperty({ description: '시간', default: Time.AFTERNOON })
  @IsEnum(Time)
  time: Time;

  @ApiProperty({ description: '비용', default: Expense.BILLS_ON_ME })
  @IsEnum(Expense)
  expense: Expense;

  @ApiProperty({ description: 'max 인원', required: true })
  @Type(() => Number)
  @IsNumber()
  max: number;

  @ApiProperty({ description: '장소에 대한 경험치', required: true })
  @Type(() => Number)
  @IsNumber()
  patron: number;

  @ApiProperty({ description: '기술/레벨', required: true })
  @Type(() => Number)
  @IsNumber()
  skill: number;

  @ApiProperty({ description: 'match count', default: 0 })
  @IsNumber()
  @IsOptional()
  matchCount: number;

  @ApiProperty({ description: 'keep count', default: 0 })
  @IsNumber()
  @IsOptional()
  keepCount: number;

  @ApiProperty({ description: 'view count', default: 0 })
  @IsNumber()
  @IsOptional()
  viewCount: number;

  @ApiProperty({ description: '신고여부', default: false })
  @IsBoolean()
  @IsOptional()
  isFlagged: boolean;

  @ApiProperty({ description: 'CreateVenueDto' })
  @ValidateNested()
  @Type(() => CreateVenueDto)
  venue: CreateVenueDto;

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
