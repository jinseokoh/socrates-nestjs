import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from 'src/domain/posts/dto/create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {}
