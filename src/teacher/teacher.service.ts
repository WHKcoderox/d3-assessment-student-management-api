import { Injectable } from '@nestjs/common';
import { Teacher } from './teacher.entity';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class TeacherService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}
}
