import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
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
    private readonly userRepository: Repository<User>,
    @Inject(ConfigService) private configService: ConfigService, // global
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //? ----------------------------------------------------------------------- //
  //? 첫인상
  //? ----------------------------------------------------------------------- //

  async upsertImpression(dto: CreateImpressionDto): Promise<any> {
    try {
      await this.userRepository.manager.query(
        'INSERT IGNORE INTO `impression` \
  (attitude, empathy, humor, compliance, manner, userId, recipientId) VALUES (?, ?, ?, ?, ?, ?, ?) \
  ON DUPLICATE KEY UPDATE \
  attitude = VALUES(`attitude`), \
  compliance = VALUES(`compliance`), \
  empathy = VALUES(`empathy`), \
  humor = VALUES(`humor`), \
  manner = VALUES(`manner`), \
  userId = VALUES(`userId`), \
  recipientId = VALUES(`recipientId`)',
        [
          dto.compliance,
          dto.attitude,
          dto.empathy,
          dto.humor,
          dto.manner,
          dto.userId, // 평가하는 사용자
          dto.recipientId, // 평가받는 사용자
        ],
      );
      const user = await this.userRepository.findOneOrFail({
        where: { id: dto.recipientId },
        relations: ['receivedImpressions'],
      });
      if (user.receivedImpressions && user.receivedImpressions.length > 1) {
        return await this.getUserImpressionAverage(dto.recipientId);
      }
      return {
        compliance: dto.compliance,
        attitude: dto.attitude,
        empathy: dto.empathy,
        humor: dto.humor,
        manner: dto.manner,
      };
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException(`user not found`);
      } else {
        throw new BadRequestException();
      }
    }
  }

  // 첫인상 평균 보기 (w/ id)
  async getUserImpressionAverage(userId: number): Promise<any> {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { id: userId },
        relations: ['receivedImpressions'],
      });
      if (user.receivedImpressions && user.receivedImpressions.length > 1) {
        const [row] = await this.userRepository.manager.query(
          'SELECT \
AVG(attitude) AS attitude, \
AVG(compliance) AS compliance, \
AVG(empathy) AS empathy, \
AVG(humor) AS humor, \
AVG(manner) AS manner \
FROM impression GROUP BY recipientId HAVING recipientId = ?',
          [userId],
        );
        return {
          attitude: Math.round(+row['attitude']),
          compliance: Math.round(+row['compliance']),
          empathy: Math.round(+row['empathy']),
          humor: Math.round(+row['humor']),
          manner: Math.round(+row['manner']),
        };
      }
    } catch (error) {
      if (error.name === 'EntityNotFoundError') {
        throw new NotFoundException(`user not found`);
      } else {
        throw new BadRequestException();
      }
    }
    throw new UnprocessableEntityException();
  }
}
