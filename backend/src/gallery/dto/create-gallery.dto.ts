import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  @IsOptional()
  content?: string;

  @IsOptional()
  thumbnail?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique((v: string) => v.toLowerCase())
  @Transform(({ value }) => {
    if (value === undefined) return undefined; // not provided -> leave unchanged on update
    if (value === null) return []; // allow null -> clear all
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter(Boolean);
    }
    // support comma-separated string
    return String(value)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })
  tags?: string[];
}
