import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDraftGalleryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  thumbnail?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique((v: string) => v.toLowerCase()) // case-insensitive dedupe
  @Transform(({ value }) => {
    // leave undefined if not provided
    if (value === undefined) return undefined;

    // allow null -> empty list
    if (value === null) return [];

    // array -> trim + drop empties
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter(Boolean);
    }

    // string -> support comma-separated
    return String(value)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })
  tags?: string[];
}
