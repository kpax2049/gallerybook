import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  // constructor(
  //   @InjectRepository(User)
  //   private usersRepository: Repository<User>,
  // ) {}

  // async create(username: string, password: string): Promise<User> {
  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   const user = this.usersRepository.create({
  //     email,
  //     password: hashedPassword,
  //   });
  //   return this.usersRepository.save(user);
  // }

  // async findOneByUsername(username: string): Promise<User | undefined> {
  //   return this.usersRepository.findOneBy({ username });
  // }
}
