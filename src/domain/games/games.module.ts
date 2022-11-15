import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/domain/games/game.entity';
import { GamesController } from 'src/domain/games/games.controller';
import { GamesService } from 'src/domain/games/games.service';
import { User } from 'src/domain/users/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Game, User])],
  providers: [GamesService],
  controllers: [GamesController],
})
export class GamesModule {}
