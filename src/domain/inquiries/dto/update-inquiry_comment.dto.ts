import { PartialType } from '@nestjs/swagger';
import { CreateInquiryCommentDto } from 'src/domain/inquiries/dto/create-inquiry_comment.dto';
export class UpdateInquiryCommentDto extends PartialType(
  CreateInquiryCommentDto,
) {}
