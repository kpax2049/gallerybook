import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const transformFolderId = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  if (
    value === null ||
    value === '' ||
    value === 'none' ||
    value === 'unfiled'
  ) {
    return null;
  }
  return Number(value);
};

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
  @Transform(transformFolderId)
  @IsInt()
  @Min(1)
  folderId?: number | null;

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
