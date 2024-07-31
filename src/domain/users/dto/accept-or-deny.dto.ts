import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JoinStatus } from 'src/common/enums';

export class AcceptOrDenyDto {
  @ApiProperty({ description: 'join status' })
  @IsEnum(JoinStatus)
  status: JoinStatus;
}
