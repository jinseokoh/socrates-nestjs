import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from 'src/domain/users/dto/create-user.dto';
export class UpdateUserDto extends PartialType(CreateUserDto) {}
