import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class ChangeUsernameDto {
  @ApiProperty({ description: '닉네임' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  username: string;
}
