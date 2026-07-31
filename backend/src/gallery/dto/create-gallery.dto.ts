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
import { IsGalleryDocument } from './is-gallery-document.decorator';
import {
  parseGalleryDocumentInput,
  ProseMirrorDocument,
} from '../zod/prosemirror.schema';

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

export class CreateGalleryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => parseGalleryDocumentInput(value))
  @IsGalleryDocument()
  content?: ProseMirrorDocument;

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
