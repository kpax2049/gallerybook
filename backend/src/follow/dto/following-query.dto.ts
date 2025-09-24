import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class FollowingQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  take?: number = 50;
}
