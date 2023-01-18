import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from 'src/domain/game-results/entities/game-result.entity';
import { GameResultsController } from 'src/domain/game-results/game-results.controller';
import { GameResultsService } from 'src/domain/game-results/game-results.service';
import { Game } from 'src/domain/games/entities/game.entity';
import { User } from 'src/domain/users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([GameResult, Game, User])],
  providers: [GameResultsService],
  controllers: [GameResultsController],
})
export class GameResultsModule {}
