import { PartialType } from '@nestjs/swagger';
import { CreateSurveyDto } from 'src/domain/surveys/dto/create-survey.dto';
export class UpdateSurveyDto extends PartialType(CreateSurveyDto) {}
