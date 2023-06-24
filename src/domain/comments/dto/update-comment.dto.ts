import { PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from 'src/domain/comments/dto/create-comment.dto';
export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
