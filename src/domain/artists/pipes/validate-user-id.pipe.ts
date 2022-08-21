import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ArtistsService } from 'src/domain/artists/artists.service';
import { UsersService } from 'src/domain/users/users.service';
@Injectable()
export class ValidateUserIdPipe implements PipeTransform {
  constructor(
    private readonly usersService: UsersService,
    private readonly artistsService: ArtistsService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform(value: any, _metadata: ArgumentMetadata) {
    // 1) if param itself exists
    if (!value.hasOwnProperty('userId')) {
      throw new BadRequestException(`userId is missing`);
    }

    // 2) if user exists
    await this.usersService.findById(+value.userId);

    // 3) if artist exists
    const artist = await this.artistsService.findByUniqueKey({
      where: { userId: +value.userId },
    });
    if (!!artist) {
      throw new BadRequestException(`artist already exists`);
    }

    return value;
  }
}
