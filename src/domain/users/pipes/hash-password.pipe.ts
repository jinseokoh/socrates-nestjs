import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
@Injectable()
export class HashPasswordPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    if (value.hasOwnProperty('password')) {
      const passwordHash = await bcrypt.hash(value.password, 10);
      value = {
        ...value,
        password: passwordHash,
      };
    }

    return value;
  }
}
