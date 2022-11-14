import { PartialType } from '@nestjs/swagger';
import { CreateGameDto } from 'src/domain/bids/dto/create-bid.dto';
export class UpdateGameDto extends PartialType(CreateGameDto) {}
