import { IsEmail } from 'class-validator';

export class GetNotificationStudentsRequestDto {
  @IsEmail()
  teacher: string;
  notification: string;
}

export class GetNotificationStudentsResponseDto {
  recipients: string[];
}
