import { IsEmail } from "class-validator";

export class RegisterStudentsQueryDto {
  @IsEmail()
  teacher: string;
  @IsEmail({}, {each: true})
  students: string[];
};