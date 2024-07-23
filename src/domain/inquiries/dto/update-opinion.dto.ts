import { PartialType } from '@nestjs/swagger';
import { CreateInquiryCommentDto } from 'src/domain/inquiries/dto/create-opinion.dto';
export class UpdateInquiryCommentDto extends PartialType(CreateInquiryCommentDto) {}
