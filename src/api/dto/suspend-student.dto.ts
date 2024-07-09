import { IsEmail } from "class-validator";

export class SuspendStudentDto {
  @IsEmail()
  student: string
}