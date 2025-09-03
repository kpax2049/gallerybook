import { ArrayUnique, IsArray, IsOptional, IsString } from 'class-validator';

export class UpsertTagsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  tags?: string[];
}
