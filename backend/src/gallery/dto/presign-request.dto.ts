import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class PresignRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  paths: string[];
}
