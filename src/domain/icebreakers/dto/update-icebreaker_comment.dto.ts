import { PartialType } from '@nestjs/swagger';
import { CreateIcebreakerCommentDto } from 'src/domain/icebreakers/dto/create-icebreaker_comment.dto';

export class UpdateIcebreakerCommentDto extends PartialType(
  CreateIcebreakerCommentDto,
) {}
