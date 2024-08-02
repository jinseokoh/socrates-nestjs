import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BookmarkUserMeetup } from 'src/domain/users/entities/bookmark_user_meetup.entity';
import { Repository } from 'typeorm/repository/Repository';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UserNotificationEvent } from 'src/domain/users/events/user-notification.event';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BookmarkUserMeetupService {
  private readonly env: any;
  private readonly logger = new Logger(BookmarkUserMeetupService.name);

  constructor(
    @InjectRepository(BookmarkUserMeetup)
    private readonly bookmarkUserMeetupRepository: Repository<BookmarkUserMeetup>,
    @InjectRepository(Meetup)
    private readonly meetupRepository: Repository<Meetup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? BookmarkUserMeetup Pivot
  //? ----------------------------------------------------------------------- //


}
