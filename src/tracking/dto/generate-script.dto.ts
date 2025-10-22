import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ScriptAttributesDto {
  @IsString()
  tenantId: string;

  // This allows for any other string properties (e.g., locationId, campaignId)
  [key: string]: string;
}

export class GenerateScriptDto {
  @ApiProperty({
    description: 'The domain name where the tracking script will be used',
    example: 'example.com',
  })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ScriptAttributesDto)
  attributes: ScriptAttributesDto;
}
