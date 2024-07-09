import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';

@Injectable()
export class ApiService {
  constructor(
    private readonly studentService: StudentService,
    private readonly teacherService: TeacherService,
  ) {}

  async registerStudents(teacherEmail: string, studentEmails: string[]) {
    await this.studentService.registerToTeacher(teacherEmail, studentEmails);
  }

  async findCommonStudents(teacherEmails: string[]): Promise<string[]> {
    return await this.teacherService.studentsRegisteredToTeachers(
      teacherEmails,
    );
  }

  async suspendStudent(student: string) {
    await this.studentService.suspendStudent(student);
  }

  async getStudentsToNotify(
    teacher: string,
    notification: string,
  ): Promise<string[]> {
    let students1: string[] = [];
    let students2: string[] = [];
    await Promise.all([
      (async () => {
        students1 =
          await this.studentService.getStudentsMentioned(notification);
      })(),
      (async () => {
        students2 = await this.teacherService.studentsRegisteredToTeachers([
          teacher,
        ]);
      })(),
    ]);
    // return union
    return Array.from(new Set([...students1, ...students2]));
  }
}
