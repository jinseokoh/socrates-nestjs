import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from 'src/domain/providers/provider.entity';
import { ProvidersService } from 'src/domain/providers/providers.service';
@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  exports: [ProvidersService],
  providers: [ProvidersService],
})
export class ProvidersModule {}
