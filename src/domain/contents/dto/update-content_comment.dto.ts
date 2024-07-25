import { PartialType } from '@nestjs/swagger';
import { CreateContentCommentDto } from 'src/domain/contents/dto/create-content_comment.dto';
export class UpdateContentCommentDto extends PartialType(
  CreateContentCommentDto,
) {}
