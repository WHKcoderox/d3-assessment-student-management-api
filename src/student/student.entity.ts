import { Column, Entity, JoinColumn, ManyToMany, PrimaryColumn } from "typeorm";
import type { Teacher } from "src/teacher/teacher.entity";


@Entity()
export class Student {
  @PrimaryColumn()
  email: string;

  @Column()
  suspended: boolean;

  @ManyToMany("Teacher", (teacher: Teacher) => teacher.students, {
    onDelete: 'CASCADE',
  })
  teachers: Teacher[];
}