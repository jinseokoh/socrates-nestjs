import { PartialType } from '@nestjs/swagger';
import { CreateRemarkDto } from 'src/domain/dots/dto/create-remark.dto';
export class UpdateRemarkDto extends PartialType(CreateRemarkDto) {}
