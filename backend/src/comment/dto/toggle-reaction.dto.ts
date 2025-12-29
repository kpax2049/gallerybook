import { ActionType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ToggleReactionDto {
  @IsEnum(ActionType)
  type: ActionType;
}
