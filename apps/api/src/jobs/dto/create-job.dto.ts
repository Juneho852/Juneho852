import { IsString, IsInt, IsBoolean, IsArray, IsOptional, Min } from 'class-validator';

export class CreateJobDto {
  @IsString()
  title: string;

  @IsInt() @Min(0)
  yearsExpNeeded: number;

  @IsInt() @Min(0)
  numChildren: number;

  @IsInt() @Min(0)
  numElderly: number;

  @IsArray() @IsString({ each: true })
  languagesRequired: string[];

  @IsArray() @IsString({ each: true })
  cookingRequired: string[];

  @IsBoolean()
  needsPetCare: boolean;

  @IsBoolean()
  needsDriving: boolean;

  @IsOptional() @IsString()
  nationalityPref?: string;

  @IsOptional()
  mbtiProfile?: Record<string, any>;

  @IsInt() @Min(0)
  budgetMin: number;

  @IsInt() @Min(0)
  budgetMax: number;
}
