import { PartialType } from '@nestjs/swagger';
import { CreateHashtagDto } from 'src/domain/hashtags/dto/create-hashtag.dto';
export class UpdateHashtagDto extends PartialType(CreateHashtagDto) {}
