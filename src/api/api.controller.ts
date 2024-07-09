import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiService } from './api.service';
import { RegisterStudentsRequestDto } from './dto/register-students.dto';
import { CommonStudentsResponseDto } from './dto/common-students.dto';
import { isArray } from 'class-validator';
import { SuspendStudentRequestDto } from './dto/suspend-student.dto';
import {
  GetNotificationStudentsRequestDto,
  GetNotificationStudentsResponseDto,
} from './dto/get-notification-students.dto';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('register')
  @HttpCode(204)
  async registerStudents(
    @Body() registerStudentsDto: RegisterStudentsRequestDto,
  ) {
    await this.apiService.registerStudents(
      registerStudentsDto.teacher,
      registerStudentsDto.students,
    );
  }

  @Get('commonstudents')
  async getCommonStudents(
    @Query('teacher') teachers: string[],
  ): Promise<CommonStudentsResponseDto> {
    if (!isArray(teachers)) {
      // class-validator does not auto-transform query...
      teachers = [teachers];
    }
    const response = new CommonStudentsResponseDto();
    response.students = await this.apiService.findCommonStudents(teachers);
    return response;
  }

  @Post('suspend')
  @HttpCode(204)
  async suspendStudent(@Body() suspendStudentDto: SuspendStudentRequestDto) {
    await this.apiService.suspendStudent(suspendStudentDto.student);
  }

  @Post('retrievefornotifications')
  @HttpCode(200)
  async getStudentsToNotify(
    @Body() getNotificationStudentDto: GetNotificationStudentsRequestDto,
  ): Promise<GetNotificationStudentsResponseDto> {
    const response = new GetNotificationStudentsResponseDto();
    response.recipients = await this.apiService.getStudentsToNotify(
      getNotificationStudentDto.teacher,
      getNotificationStudentDto.notification,
    );
    return response;
  }
}
