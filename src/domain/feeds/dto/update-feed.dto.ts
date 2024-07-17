import { PartialType } from '@nestjs/swagger';
import { CreateFeedDto } from 'src/domain/feeds/dto/create-connection.dto';
export class UpdateFeedDto extends PartialType(CreateFeedDto) {}
