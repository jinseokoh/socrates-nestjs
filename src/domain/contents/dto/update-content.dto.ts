import { PartialType } from '@nestjs/swagger';
import { CreateContentDto } from 'src/domain/contents/dto/create-content.dto';
export class UpdateContentDto extends PartialType(CreateContentDto) {}
