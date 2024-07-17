import { PartialType } from '@nestjs/swagger';
import { CreateReactionDto } from 'src/domain/feeds/dto/create-reaction.dto';
export class UpdateReactionDto extends PartialType(CreateReactionDto) {}
