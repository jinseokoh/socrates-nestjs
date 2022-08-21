import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from 'src/domain/profiles/profiles.service';
import { Profile } from './profile.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Profile])],
  providers: [ProfilesService],
})
export class ProfilesModule {}
