import { PartialType } from '@nestjs/swagger';
import { CreateMeetupCommentDto } from 'src/domain/meetups/dto/create-meetup_comment.dto';

export class UpdateMeetupCommentDto extends PartialType(
  CreateMeetupCommentDto,
) {}
