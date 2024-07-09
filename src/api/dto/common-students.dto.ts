import { ArrayMinSize, IsArray, IsEmail, IsNotEmpty, IsString } from "class-validator"

export class CommonStudentsResponseDto {
  students: string[]
}

export class CommonStudentsQueryDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsEmail({}, {each: true})
  @ArrayMinSize(1)
  teacher: string[]
}