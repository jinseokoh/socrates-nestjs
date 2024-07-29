import { PartialType } from '@nestjs/swagger';
import { CreateReactionDto } from 'src/domain/icebreakers/dto/create-reaction.dto';
export class UpdateReactionDto extends PartialType(CreateReactionDto) {}
