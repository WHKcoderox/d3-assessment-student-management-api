import { IsEmail } from 'class-validator';

export class RegisterStudentsRequestDto {
  @IsEmail()
  teacher: string;
  @IsEmail({}, { each: true })
  students: string[];
}
