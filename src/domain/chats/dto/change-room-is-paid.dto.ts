import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChangeRoomIsPaidDto {
  @ApiProperty({ description: 'meetupId' })
  @IsNumber()
  meetupId: number;

  @ApiProperty({ description: 'userId' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '변경비용' })
  @IsNumber()
  costToUpdate: number;
}
