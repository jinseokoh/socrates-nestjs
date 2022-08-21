import { PartialType } from '@nestjs/swagger';
import { CreatePostCommentDto } from 'src/domain/post-comments/dto/create-post-comment.dto';
export class UpdatePostCommentDto extends PartialType(CreatePostCommentDto) {}
