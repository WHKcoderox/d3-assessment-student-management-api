import { Student } from "../src/student/student.entity";

export class StudentFactory {
  static currentId: number = 0;

  static resetCount(): void {
    this.currentId = 0;
  }

  static createStudent(): Student {
    this.currentId += 1;
    let student = new Student();
    student.email = `s${this.currentId}@test.com`;
    student.suspended = false;
    student.teachers = [];
    return student;
  }
}