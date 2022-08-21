import { PartialType } from '@nestjs/swagger';
import { CreateQuestionDto } from 'src/domain/questions/dto/create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
