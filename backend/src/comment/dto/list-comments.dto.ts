import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListCommentsDto {
  @Transform(({ value }) =>
    value == null || value === '' ? 'onMyGalleries' : String(value),
  )
  @IsIn(['onMyGalleries', 'authored', 'mentions'])
  scope!: 'onMyGalleries' | 'authored' | 'mentions';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const s = String(value ?? '').trim();
    return s.length ? s : undefined;
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
