import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';
import { User } from 'src/domain/users/user.entity';

export interface Response<T> {
  data: T;
}

@Injectable()
export class AvatarInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): any {
    return next.handle().pipe(
      map((data) => {
        const users = data.data.map((user: User) => {
          if (!user.avatar) {
            user.avatar = 'https://cdn.fleaauction.world/images/user.png';
          }
          return user;
        });

        return {
          ...data,
          data: users,
        };
      }),
    );
  }
}
