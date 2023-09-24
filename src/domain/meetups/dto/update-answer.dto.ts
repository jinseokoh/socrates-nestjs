import { PartialType } from '@nestjs/swagger';
import { CreateAnswerDto } from 'src/domain/meetups/dto/create-answer.dto';

export class UpdateAnswerDto extends PartialType(CreateAnswerDto) {}
