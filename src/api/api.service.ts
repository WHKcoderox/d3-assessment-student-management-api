import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';
import { Student } from '../student/student.entity';

@Injectable()
export class ApiService {
  constructor(
    private readonly studentService: StudentService,
    private readonly teacherService: TeacherService,
  ) {}

  async setStudentsRegistration(
    teacherEmail: string,
    studentEmails: string[],
    register: boolean = true,
  ) {
    await this.studentService.setRegistrationToTeacher(
      teacherEmail,
      studentEmails,
      register,
    );
  }

  async findCommonStudents(teacherEmails: string[]): Promise<string[]> {
    return await this.teacherService.studentsRegisteredToTeachers(
      teacherEmails,
    ).then(students => students.map(student => student.email));
  }

  async suspendStudent(student: string) {
    await this.studentService.setStudentSuspendStatus(student);
  }

  async unsuspendStudent(student: string) {
    await this.studentService.setStudentSuspendStatus(student, false);
  }

  async getStudentsToNotify(
    teacher: string,
    notification: string,
  ): Promise<string[]> {
    let students1: Student[] = [];
    let students2: Student[] = [];
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
    let filtered = students1
      .concat(students2)
      .filter(student => !student.suspended)
      .map(student => student.email);
    return Array.from(new Set([...filtered]));
  }
}
