import { PartialType } from '@nestjs/swagger';
import { CreateIcebreakerDto } from 'src/domain/icebreakers/dto/create-icebreaker.dto';
export class UpdateIcebreakerDto extends PartialType(CreateIcebreakerDto) {}
