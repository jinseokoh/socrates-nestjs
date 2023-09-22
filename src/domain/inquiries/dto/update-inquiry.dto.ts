import { PartialType } from '@nestjs/swagger';
import { CreateInquiryDto } from 'src/domain/inquiries/dto/create-inquiry.dto';

export class UpdateInquiryDto extends PartialType(CreateInquiryDto) {}
