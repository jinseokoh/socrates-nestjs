import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { CreateImpressionDto } from 'src/domain/users/dto/create-impression.dto';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';

@Injectable()
export class UserImpressionsService {
  private readonly env: any;
  private readonly logger = new Logger(UserImpressionsService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? 첫인상
  //?-------------------------------------------------------------------------//

  async upsertImpression(dto: CreateImpressionDto): Promise<any> {
    try {
      await this.repository.manager.query(
        'INSERT IGNORE INTO `impression` \
  (attitude, empathy, humor, appropriateness, manner, userId, recipientId) VALUES (?, ?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  appropriateness = VALUES(`appropriateness`), \
  attitude = VALUES(`attitude`), \
  empathy = VALUES(`empathy`), \
  humor = VALUES(`humor`), \
  manner = VALUES(`manner`), \
  userId = VALUES(`userId`), \
  recipientId = VALUES(`recipientId`)',
        [
          dto.appropriateness,
          dto.attitude,
          dto.empathy,
          dto.humor,
          dto.manner,
          dto.userId, // 평가하는 사용자
          dto.recipientId, // 평가받는 사용자
        ],
      );

      const user = await this.repository.findOneOrFail({
        where: { id: dto.recipientId },
        relations: ['receivedImpressions'],
      });

      console.log(user);
      if (user.receivedImpressions && user.receivedImpressions.length > 1) {
        const impressionAverage = await this.getImpressionAverageById(
          dto.userId,
        );
        // todo. save it to profile model.
        // const dto = new UpdateProfileDto();
        // dto.impressions = impressions;
        // await this.usersService.updateProfile(id, dto);
        return impressionAverage;
      } else {
        return {
          appropriateness: dto.appropriateness,
          attitude: dto.attitude,
          empathy: dto.empathy,
          humor: dto.humor,
          manner: dto.manner,
        };
      }
    } catch (e) {
      this.logger.log(e);
      throw new BadRequestException();
    }
  }

  // 첫인상 평균 보기 (w/ id)
  async getImpressionAverageById(recipientId: number): Promise<any> {
    try {
      const [row] = await this.repository.manager.query(
        'SELECT \
AVG(appropriateness) AS appropriateness, \
AVG(attitude) AS attitude, \
AVG(empathy) AS empathy, \
AVG(humor) AS humor, \
AVG(manner) AS manner \
FROM impression \
GROUP BY recipientId HAVING recipientId = ?',
        [recipientId],
      );
      console.log(row);

      return {
        appropriateness: parseFloat(row['appropriateness']).toFixed(1),
        attitude: parseFloat(row['attitude']).toFixed(1),
        empathy: parseFloat(row['empathy']).toFixed(1),
        humor: parseFloat(row['humor']).toFixed(1),
        manner: parseFloat(row['manner']).toFixed(1),
      };

      // return {
      //   appropriateness: +parseFloat(row['appropriateness']).toFixed(2),
      //   attitude: +parseFloat(row['attitude']).toFixed(2),
      //   empathy: +parseFloat(row['empathy']).toFixed(2),
      //   humor: +parseFloat(row['humor']).toFixed(2),
      //   manner: +parseFloat(row['manner']).toFixed(2),
      // };
    } catch (e) {
      throw new NotFoundException('entity not found');
    }
  }
}
