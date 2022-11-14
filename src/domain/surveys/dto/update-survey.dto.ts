import { PartialType } from '@nestjs/swagger';
import { CreatesurveyDto } from 'src/domain/surveys/dto/create-survey.dto';
export class UpdatesurveyDto extends PartialType(CreatesurveyDto) {}
