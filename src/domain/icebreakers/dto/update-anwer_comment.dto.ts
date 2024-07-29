import { PartialType } from '@nestjs/swagger';
import { CreateAnswerCommentDto } from 'src/domain/icebreakers/dto/create-answer_comment.dto';
export class UpdateAnswerCommentDto extends PartialType(
  CreateAnswerCommentDto,
) {}
