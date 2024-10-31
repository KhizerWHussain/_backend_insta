import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }
}

export class SignupRequestDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(8, 30, { message: 'Password must be between 8 and 30 characters' })
  @IsNotEmpty()
  @Matches(
    /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
    {
      message:
        'Password must contain at least one letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsEnum(GenderType)
  @IsString()
  @IsOptional()
  gender?: GenderType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true }) // Transform string to number
  profileMediaId?: number;
}

export class SigninRequestDTO {
  @ApiProperty({ description: 'userNameOrEmail' })
  @IsString()
  userNameOrEmail: string;

  @ApiProperty({ description: 'Password' })
  @Length(1, 255)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  fcmToken: string;
}

class WebLinkDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string;
}

export default class UpdateMyProfileDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsEnum(GenderType)
  @IsString()
  @IsOptional()
  gender?: GenderType;

  @ApiPropertyOptional()
  @IsOptional()
  webLink?: WebLinkDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pronouns?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  profileMediaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  profileMusicId?: number;
}
