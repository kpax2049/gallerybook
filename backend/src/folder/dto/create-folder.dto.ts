import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trimOptionalString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const trimRequiredString = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return value;
  return String(value).trim();
};

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(trimRequiredString)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(trimOptionalString)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Transform(trimOptionalString)
  color?: string;
}
