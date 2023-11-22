import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguagesController } from 'src/domain/languages/languages.controller';
import { LanguagesService } from 'src/domain/languages/languages.service';
import { Language } from 'src/domain/languages/entities/language.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  providers: [LanguagesService],
  controllers: [LanguagesController],
})
export class LanguagesModule {}
