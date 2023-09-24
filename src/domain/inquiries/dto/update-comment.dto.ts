import { PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from 'src/domain/inquiries/dto/create-comment.dto';
export class UpdateCommentDto extends PartialType(CreateCommentDto) {}
