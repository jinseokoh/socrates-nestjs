import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { ProfilesService } from 'src/domain/users/profiles.service';
@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  providers: [ProfilesService],
})
export class ProfilesModule {}
