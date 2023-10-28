import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JoinStatus, JoinType } from 'src/common/enums';

export class AcceptOrDenyDto {
  @ApiProperty({ description: 'join status' })
  @IsEnum(JoinStatus)
  status: JoinStatus;

  @ApiProperty({ description: 'join type' })
  @IsEnum(JoinType)
  joinType: JoinType;
}
