import { PartialType } from '@nestjs/swagger';
import { CreateProfileDto } from 'src/domain/profiles/dto/create-profile.dto';
export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
