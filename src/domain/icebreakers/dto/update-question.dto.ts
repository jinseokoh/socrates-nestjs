import { PartialType } from '@nestjs/swagger';
import { CreateQuestionDto } from 'src/domain/icebreakers/dto/create-question.dto';
export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
