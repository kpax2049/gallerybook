import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ACCOUNT_EMAIL_MAX_LENGTH,
  ACCOUNT_FULL_NAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MIN_LENGTH,
  NormalizeEmail,
  TrimAccountText,
} from 'src/common/account-validation';

export class SignupDto {
  @NormalizeEmail()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_EMAIL_MAX_LENGTH)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @TrimAccountText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FULL_NAME_MAX_LENGTH)
  fullName: string;

  @TrimAccountText()
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_USERNAME_MIN_LENGTH)
  @MaxLength(ACCOUNT_USERNAME_MAX_LENGTH)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  turnstileToken?: string;
}
