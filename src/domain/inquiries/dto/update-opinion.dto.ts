import { PartialType } from '@nestjs/swagger';
import { CreateOpinionDto } from 'src/domain/inquiries/dto/create-opinion.dto';
export class UpdateOpinionDto extends PartialType(CreateOpinionDto) {}
