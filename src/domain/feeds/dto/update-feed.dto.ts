import { PartialType } from '@nestjs/swagger';
import { CreateFeedDto } from 'src/domain/feeds/dto/create-feed.dto';
export class UpdateFeedDto extends PartialType(CreateFeedDto) {}
