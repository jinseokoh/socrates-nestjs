import { PartialType } from '@nestjs/swagger';
import { CreateGameDto } from 'src/domain/games/dto/create-game.dto';
export class UpdateGameDto extends PartialType(CreateGameDto) {}
