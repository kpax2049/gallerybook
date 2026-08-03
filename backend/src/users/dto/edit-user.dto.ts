import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  ACCOUNT_EMAIL_MAX_LENGTH,
  ACCOUNT_FULL_NAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MAX_LENGTH,
  ACCOUNT_USERNAME_MIN_LENGTH,
  NormalizeEmail,
  TrimAccountText,
} from 'src/common/account-validation';

export class EditUserDto {
  @NormalizeEmail()
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  @MaxLength(ACCOUNT_EMAIL_MAX_LENGTH)
  email?: string;

  @TrimAccountText()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FULL_NAME_MAX_LENGTH)
  fullName?: string;

  @TrimAccountText()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MinLength(ACCOUNT_USERNAME_MIN_LENGTH)
  @MaxLength(ACCOUNT_USERNAME_MAX_LENGTH)
  username?: string;
}
