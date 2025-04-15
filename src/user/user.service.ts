import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find({ select: ['id', 'name', 'username', 'email'] });
  }

  async findOneById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(data: Partial<User>) {
    const exists = await this.userRepository.findOne({
      where: [{ username: data.username }, { email: data.email }],
    });

    if (exists) throw new ConflictException('Usuário ou e-mail já cadastrado');

    const hash = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({ ...data, password: hash });
    await this.userRepository.save(user);

    delete user.password;
    return user;
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.findOneById(id);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.userRepository.update(id, data);
    return this.findOneById(id);
  }

  async delete(id: number) {
    const user = await this.findOneById(id);
    await this.userRepository.remove(user);
  }
}