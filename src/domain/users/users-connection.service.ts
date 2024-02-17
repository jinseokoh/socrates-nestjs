import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  PaginateConfig,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { Emotion } from 'src/common/enums';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'src/domain/connections/entities/connection.entity';
import { FcmService } from 'src/services/fcm/fcm.service';
import { Reaction } from 'src/domain/connections/entities/reaction.entity';
import { ReportConnection } from 'src/domain/connections/entities/report_connection.entity';
import { Repository } from 'typeorm/repository/Repository';
import { User } from 'src/domain/users/entities/user.entity';
import { Plea } from 'src/domain/users/entities/plea.entity';
import { Dot } from 'src/domain/connections/entities/dot.entity';

@Injectable()
export class UsersConnectionService {
  private readonly env: any;
  private readonly logger = new Logger(UsersConnectionService.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(Dot)
    private readonly dotRepository: Repository<Dot>,
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    @InjectRepository(Plea)
    private readonly pleaRepository: Repository<Plea>,
    @InjectRepository(ReportConnection)
    private readonly reportConnectionRepository: Repository<ReportConnection>,
    @Inject(ConfigService) private configService: ConfigService, // global
    private readonly fcmService: FcmService,
    private dataSource: DataSource, // for transaction
  ) {
    this.env = this.configService.get('nodeEnv');
  }

  //?-------------------------------------------------------------------------//
  //? Connections
  //?-------------------------------------------------------------------------//

  // 내가 만든 발견 리스트 (paginated)
  async getMyConnections(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Connection>> {
    const queryBuilder = this.connectionRepository
      .createQueryBuilder('connection')
      .innerJoinAndSelect('connection.dot', 'dot')
      .innerJoinAndSelect('connection.user', 'user')
      .leftJoinAndSelect('connection.remarks', 'remarks')
      .where({
        userId,
      });

    const config: PaginateConfig<Connection> = {
      sortableColumns: ['createdAt'],
      searchableColumns: ['answer'],
      defaultLimit: 20,
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        region: [FilterOperator.EQ, FilterOperator.IN],
        category: [FilterOperator.EQ, FilterOperator.IN],
        subCategory: [FilterOperator.EQ, FilterOperator.IN],
        targetGender: [FilterOperator.EQ, FilterOperator.IN],
        expiredAt: [FilterOperator.GTE, FilterOperator.LT],
      },
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? ReportConnection Pivot
  //?-------------------------------------------------------------------------//

  // 차단한 발견 리스트에 추가
  async attachToReportConnectionPivot(
    userId: number,
    connectionId: number,
    message: string,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'INSERT IGNORE INTO `report_connection` (userId, connectionId, message) VALUES (?, ?, ?)',
      [userId, connectionId, message],
    );
    if (affectedRows > 0) {
      await this.connectionRepository.increment(
        { id: connectionId },
        'reportCount',
        1,
      );
    }
  }

  // 차단한 발견 리스트에서 삭제
  async detachFromReportConnectionPivot(
    userId: number,
    connectionId: number,
  ): Promise<void> {
    const { affectedRows } = await this.repository.manager.query(
      'DELETE FROM `report_connection` WHERE userId = ? AND connectionId = ?',
      [userId, connectionId],
    );
    if (affectedRows > 0) {
      // await this.connectionRrepository.decrement({ connectionId }, 'ReportConnectionCount', 1);
      await this.repository.manager.query(
        'UPDATE `connection` SET reportCount = reportCount - 1 WHERE id = ? AND reportCount > 0',
        [connectionId],
      );
    }
  }

  // 내가 차단한 발견 리스트 (paginated)
  async getConnectionsReportedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<ReportConnection>> {
    const queryBuilder = this.reportConnectionRepository
      .createQueryBuilder('report_connection')
      .leftJoinAndSelect('report_connection.connection', 'connection')
      .leftJoinAndSelect('connection.dot', 'dot')
      .where({
        userId,
      });

    const config: PaginateConfig<ReportConnection> = {
      sortableColumns: ['connectionId'],
      searchableColumns: ['connection.answer'],
      defaultLimit: 20,
      defaultSortBy: [['connectionId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  // 내가 차단한 발견ID 리스트 (all)
  async getConnectionIdsReportedByMe(userId: number): Promise<number[]> {
    const items = await this.repository.manager.query(
      'SELECT connectionId \
      FROM `user` INNER JOIN `report_connection` \
      ON `user`.id = `report_connection`.userId \
      WHERE `user`.id = ?',
      [userId],
    );

    return items.map(({ connectionId }) => connectionId);
  }

  //?-------------------------------------------------------------------------//
  //?  Reaction Pivot
  //?-------------------------------------------------------------------------//

  // 발견 reaction 리스트에 추가
  async attachToReactionPivot(
    userId: number,
    connectionId: number,
    emotion: Emotion,
  ): Promise<Reaction> {
    // upsert reaction
    try {
      const { affectedRows } = await this.repository.manager.query(
        `INSERT IGNORE INTO reaction (userId, connectionId, ${emotion}) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE userId = VALUES(userId), connectionId = VALUES(connectionId), ${emotion} = VALUES(${emotion})`,
        [userId, connectionId, true],
      );
      if (affectedRows > 1) {
        // returns 2 if updated
        await this.connectionRepository.increment(
          { id: connectionId },
          `${emotion}Count`,
          1,
        );
      }
    } catch (e) {
      this.logger.log(e);
    }
    // return reaction
    return await this.reactionRepository.findOne({
      where: {
        userId,
        connectionId,
      },
    });
  }

  // 발견 reaction 리스트에서 삭제
  async detachFromReactionPivot(
    userId: number,
    connectionId: number,
    emotion: string,
  ): Promise<Reaction> {
    try {
      const { changedRows } = await this.reactionRepository.manager.query(
        `UPDATE reaction SET ${emotion} = ? WHERE userId = ? AND connectionId = ?`,
        [false, userId, connectionId],
      );
      if (changedRows > 0) {
        // returns 1 if updated
        await this.reactionRepository.manager.query(
          `UPDATE connection SET ${emotion}Count = ${emotion}Count - 1 WHERE id = ? AND ${emotion}Count > 0`,
          [connectionId],
        );
      }
    } catch (e) {
      this.logger.log(e);
    }
    // return reaction
    return await this.reactionRepository.findOne({
      where: {
        userId,
        connectionId,
      },
    });
  }

  // 발견 reaction 조회
  async getReaction(userId: number, connectionId: number): Promise<Reaction> {
    try {
      return await this.reactionRepository.findOneOrFail({
        where: { userId, connectionId },
      });
    } catch (e) {
      //? in case of 404
      return new Reaction({
        userId: userId,
        connectionId: connectionId,
        sympathetic: false,
        surprised: false,
        humorous: false,
        sad: false,
        disgust: false,
      });
    }
  }

  // 발견 reaction 리스트 (all)
  async getReactions(
    userId: number,
    connectionIds: number[],
  ): Promise<Array<Reaction>> {
    try {
      const items = await this.reactionRepository
        .createQueryBuilder()
        .where('connectionId IN (:ids)', { ids: connectionIds })
        .andWhere('userId = :id', { id: userId })
        .getMany();

      return items;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  // 내가 반응한 발견 리스트 (paginated)
  async getConnectionsReactedByMe(
    userId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Reaction>> {
    const queryBuilder = this.reactionRepository
      .createQueryBuilder('reaction')
      .innerJoinAndSelect('reaction.connection', 'connection')
      .innerJoinAndSelect('connection.dot', 'dot')
      .innerJoinAndSelect('connection.user', 'user')
      .leftJoinAndSelect('connection.userReactions', 'reactions')
      .where({
        userId,
      });

    const config: PaginateConfig<Reaction> = {
      sortableColumns: ['connectionId'],
      defaultLimit: 20,
      defaultSortBy: [['connectionId', 'DESC']],
      filterableColumns: {},
    };

    return await paginate(query, queryBuilder, config);
  }

  //?-------------------------------------------------------------------------//
  //? Plea Pivot
  //?-------------------------------------------------------------------------//

  // 발견요청 리스트에 추가
  async attachToPleaPivot(
    askingUserId: number,
    askedUserId: number,
    dotId: number,
  ): Promise<Dot> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.manager.query(
      'INSERT IGNORE INTO `plea` (askingUserId, askedUserId, dotId) VALUES (?, ?, ?)',
      [askingUserId, askedUserId, dotId],
    );

    const dot = await this.dotRepository.findOneOrFail({
      where: { id: dotId },
      relations: ['pleas'],
    });

    return dot;
  }

  async getUniqueUsersPleaded(userId: number): Promise<User[]> {
    const items = await this.pleaRepository
      .createQueryBuilder('plea')
      .innerJoinAndSelect('plea.askingUser', 'askingUser')
      .where({
        askedUserId: userId,
      })
      .groupBy('plea.askingUserId')
      .getMany();

    return items.map((v) => v.askingUser);
  }
}
