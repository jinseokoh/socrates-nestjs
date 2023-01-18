import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from 'src/domain/users/entities/provider.entity';
import { ProvidersService } from 'src/domain/users/providers.service';
@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  exports: [ProvidersService],
  providers: [ProvidersService],
})
export class ProvidersModule {}
