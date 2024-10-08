import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { FriendshipStatus } from 'src/common/enums';
export class CreateFriendshipDto {
  @ApiProperty({ description: 'senderId' })
  @IsNumber()
  @IsOptional()
  senderId: number;

  @ApiProperty({ description: 'recipientId' })
  @IsNumber()
  @IsOptional()
  recipientId: number;

  @ApiProperty({ description: 'request 보내는 origin' })
  @IsNotEmpty()
  @IsString()
  requestFrom: string;

  @ApiProperty({ description: '친구신청시 보내는 글' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  message: string;

  @ApiProperty({ description: '친구신청 비용' })
  @IsNumber()
  cost: number;

  @ApiProperty({
    description: 'status',
    default: FriendshipStatus.PENDING,
    required: true,
  })
  @IsEnum(FriendshipStatus)
  @IsOptional()
  status: FriendshipStatus;

  @ApiProperty({ description: 'plea Id' })
  @IsNumber()
  @IsOptional()
  pleaId?: number;
}
