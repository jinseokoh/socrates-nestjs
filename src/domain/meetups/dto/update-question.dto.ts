import { PartialType } from '@nestjs/swagger';
import { CreateQuestionDto } from 'src/domain/meetups/dto/create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}
