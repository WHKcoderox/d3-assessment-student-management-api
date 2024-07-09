import { Entity, JoinTable, ManyToMany, PrimaryColumn } from "typeorm";
import type { Student } from "src/student/student.entity";

@Entity()
export class Teacher {
  @PrimaryColumn()
  email: string;

  @ManyToMany("Student", (student: Student) => student.teachers, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: "teacher_students",
    joinColumn: {
      name: "teacher",
      referencedColumnName: "email"
  },
  inverseJoinColumn: {
      name: "student",
      referencedColumnName: "email"
  }
  })
  students: Student[];
}