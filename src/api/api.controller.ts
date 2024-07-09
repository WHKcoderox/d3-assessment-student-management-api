import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiService } from './api.service';
import { RegisterStudentsDto } from './dto/register-students.dto';

@Controller('api')
export class ApiController {
  constructor(
    private readonly apiService: ApiService
  ) {}

  @Post('register')
  @HttpCode(204)
  async registerStudents(@Body() registerStudentsDto: RegisterStudentsDto): Promise<string> {
    await this.apiService.registerStudents(
      registerStudentsDto.teacher, 
      registerStudentsDto.students
    );
    
    return 'Successfully registered students';
  }

  @Get('commonstudents')
  getCommonStudents(): any {
    return {};
  }
}
