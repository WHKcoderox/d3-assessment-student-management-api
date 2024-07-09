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

  async findCommonStudents(teacherEmails: string[]): Promise<string[]> {
    return await this.teacherService.studentsRegisteredToTeachers(teacherEmails);
  }
  async suspendStudent(student: string) {
    await this.studentService.suspendStudent(student);
  }
}
