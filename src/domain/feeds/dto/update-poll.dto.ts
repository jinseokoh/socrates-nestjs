import { PartialType } from '@nestjs/swagger';
import { CreatePollDto } from 'src/domain/feeds/dto/create-poll.dto';
export class UpdatePollDto extends PartialType(CreatePollDto) {}
