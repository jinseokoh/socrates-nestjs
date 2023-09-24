import { PartialType } from '@nestjs/swagger';
import { CreateThreadDto } from 'src/domain/meetups/dto/create-thread.dto';

export class UpdateThreadDto extends PartialType(CreateThreadDto) {}
