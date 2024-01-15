import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  brand: string;

  @IsNotEmpty()
  fuel: string;

  @IsNotEmpty()
  location: string;

  @IsNotEmpty()
  transmission: string;

  @IsNotEmpty()
  manuDate: number;

  @IsNotEmpty()
  price: number;

  // @IsNotEmpty()
  // document: string;

  @IsOptional()
  image: string[];
}
