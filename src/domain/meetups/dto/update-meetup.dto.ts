import { PartialType } from '@nestjs/swagger';
import { CreateMeetupDto } from 'src/domain/meetups/dto/create-meetup.dto';
export class UpdateMeetupDto extends PartialType(CreateMeetupDto) {}
