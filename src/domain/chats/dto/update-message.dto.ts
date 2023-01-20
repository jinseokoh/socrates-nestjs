import { PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from 'src/domain/chats/dto/create-message.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {}
