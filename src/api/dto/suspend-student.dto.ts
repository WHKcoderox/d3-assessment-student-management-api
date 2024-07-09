import { IsEmail } from 'class-validator';

export class SuspendStudentRequestDto {
  @IsEmail()
  student: string;
}
