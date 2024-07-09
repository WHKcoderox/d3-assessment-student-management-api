import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';

@Injectable()
export class ApiService {
  constructor(
    private readonly studentService: StudentService,
    private readonly teacherService: TeacherService
  ) {}

  async registerStudents(teacherEmail: string, studentEmails: string[]) {
    await this.studentService.registerToTeacher(
      teacherEmail, 
      studentEmails
    );
  }
}
