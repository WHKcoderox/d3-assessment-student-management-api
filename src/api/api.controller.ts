import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiService } from './api.service';
import { RegisterStudentsQueryDto } from './dto/register-students.dto';
import { CommonStudentsResponseDto, CommonStudentsQueryDto } from './dto/common-students.dto';
import { Request } from 'express';
import { isArray } from 'class-validator';

@Controller('api')
export class ApiController {
  constructor(
    private readonly apiService: ApiService
  ) {}

  @Post('register')
  @HttpCode(204)
  async registerStudents(@Body() registerStudentsDto: RegisterStudentsQueryDto): Promise<string> {
    await this.apiService.registerStudents(
      registerStudentsDto.teacher, 
      registerStudentsDto.students
    );
    
    return 'Successfully registered students';
  }

  @Get('commonstudents')
  async getCommonStudents(@Query('teacher') teachers: string[]): Promise<CommonStudentsResponseDto> {
    if (!isArray(teachers)) {
      // class-validator does not auto-transform query...
      teachers = [teachers];
    }
    let response = new CommonStudentsResponseDto();
    response.students = await this.apiService.findCommonStudents(teachers);
    return response;
  }
}
