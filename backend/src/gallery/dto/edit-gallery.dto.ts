import { IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EditGalleryDto {
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsJSON()
  @IsOptional()
  content?: string;

  @IsOptional()
  thumbnail: any;
  // TODO: define Image field
  // images: Image[]
}
