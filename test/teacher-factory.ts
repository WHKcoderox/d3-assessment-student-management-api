import { Teacher } from "../src/teacher/teacher.entity";

export class TeacherFactory {
  static currentId: number = 0;

  static resetCount(): void {
    this.currentId = 0;
  }

  static createTeacher(): Teacher {
    this.currentId += 1;
    let teacher = new Teacher();
    teacher.email = `t${this.currentId}@test.com`;
    teacher.students = [];
    return teacher;
  }
}