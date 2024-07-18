import { PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from 'src/domain/feeds/dto/create-comment.dto';
export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
