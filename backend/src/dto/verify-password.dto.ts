import { IsString, Length } from 'class-validator';

export class VerifyPasswordDto {
  @IsString()
  @Length(8, 128)
  currentPassword: string;
}
