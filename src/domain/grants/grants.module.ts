import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsModule } from 'src/domain/coupons/coupons.module';
import { GrantsCouponsController } from 'src/domain/grants/grants-coupons.controller';
import { GrantsUsersController } from 'src/domain/grants/grants-users.controller';
import { GrantsService } from 'src/domain/grants/grants.service';
import { UsersModule } from 'src/domain/users/users.module';
import { Grant } from './grant.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Grant]), UsersModule, CouponsModule],
  exports: [GrantsService],
  providers: [GrantsService],
  controllers: [GrantsUsersController, GrantsCouponsController],
})
export class GrantsModule {}
