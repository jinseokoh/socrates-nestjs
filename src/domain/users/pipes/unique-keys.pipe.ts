import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { UsersService } from 'src/domain/users/users.service';
@Injectable()
export class UniqueKeysPipe implements PipeTransform {
  constructor(private readonly usersService: UsersService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('username')) {
      const user = await this.usersService.findByUniqueKey({
        where: { username: value.username },
      });
      if (user != null) {
        throw new BadRequestException(`username already taken`);
      }
    }

    if (value.hasOwnProperty('email')) {
      const user = await this.usersService.findByUniqueKey({
        where: { email: value.email },
      });
      if (user != null) {
        throw new BadRequestException(`email already taken`);
      }
    }

    if (value.hasOwnProperty('phone')) {
      const user = await this.usersService.findByUniqueKey({
        where: { phone: value.phone },
      });
      if (user != null) {
        throw new BadRequestException(`phone number already taken`);
      }
    }

    return value;
  }
}
