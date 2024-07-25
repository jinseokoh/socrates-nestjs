import { PartialType } from '@nestjs/swagger';
import { CreateFeedCommentDto } from 'src/domain/feeds/dto/create-feed_comment.dto';
export class UpdateFeedCommentDto extends PartialType(CreateFeedCommentDto) {}
