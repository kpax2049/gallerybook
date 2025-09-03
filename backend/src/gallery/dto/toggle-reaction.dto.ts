import { IsIn, IsInt } from 'class-validator';

export class ToggleReactionDto {
  @IsIn(['LIKE', 'FAVORITE'])
  type!: 'LIKE' | 'FAVORITE';
}

export class ParamIdDto {
  @IsInt()
  id!: number;
}
