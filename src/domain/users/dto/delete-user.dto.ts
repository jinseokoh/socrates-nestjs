import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class DeleteUserDto {
  @ApiProperty({ description: '탈퇴사유' })
  @IsString()
  @IsOptional()
  reason: string | null;
}
