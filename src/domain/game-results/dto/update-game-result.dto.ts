import { PartialType } from '@nestjs/swagger';
import { CreateGameResultDto } from 'src/domain/game-results/dto/create-game-result.dto';
export class UpdateGameResultDto extends PartialType(CreateGameResultDto) {}
