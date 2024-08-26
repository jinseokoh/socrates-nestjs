import { PartialType } from '@nestjs/swagger';
import { CreateIcebreakerAnswerDto } from 'src/domain/icebreakers/dto/create-icebreaker_answer.dto';

export class UpdateIcebreakerAnswerDto extends PartialType(
  CreateIcebreakerAnswerDto,
) {}
