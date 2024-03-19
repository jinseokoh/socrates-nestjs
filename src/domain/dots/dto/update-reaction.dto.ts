import { PartialType } from '@nestjs/swagger';
import { CreateReactionDto } from 'src/domain/dots/dto/create-reaction.dto';
export class UpdateReactionDto extends PartialType(CreateReactionDto) {}
