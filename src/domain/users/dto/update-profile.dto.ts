import { PartialType } from '@nestjs/swagger';
import { CreateProfileDto } from 'src/domain/users/dto/create-profile.dto';
export class UpdateProfileDto extends PartialType(CreateProfileDto) {}
