import { PartialType } from '@nestjs/swagger';
import { CreateNewsDto } from 'src/domain/news/dto/create-news.dto';
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
