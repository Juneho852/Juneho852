import { IsOptional, IsString, IsInt, IsBoolean, IsArray, Min } from 'class-validator';

export class UpdateHelperProfileDto {
  @IsOptional() @IsString()
  fullName?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  nationality?: string;

  @IsOptional() @IsInt() @Min(0)
  yearsExperience?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  languages?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  cookingTypes?: string[];

  @IsOptional() @IsBoolean()
  hasPetCare?: boolean;

  @IsOptional() @IsBoolean()
  hasDriving?: boolean;

  @IsOptional() @IsInt() @Min(0)
  childrenExperience?: number;

  @IsOptional() @IsInt() @Min(0)
  elderlyExperience?: number;

  @IsOptional() @IsString()
  mbtiType?: string;

  @IsOptional() @IsString()
  profilePhotoUrl?: string;
}
