import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthProvider } from './enums/auth-provider.enum';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

const SALT_ROUNDS = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ googleId });
  }

  createLocalUser(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      name: data.name,
      password: data.passwordHash,
      provider: AuthProvider.LOCAL,
    });
    return this.usersRepository.save(user);
  }

  createGoogleUser(data: {
    email: string;
    name: string;
    googleId: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email,
      name: data.name,
      googleId: data.googleId,
      provider: AuthProvider.GOOGLE,
    });
    return this.usersRepository.save(user);
  }

  async createLocalUserWithPassword(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.createLocalUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
  }

  findLocalUserById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id, provider: AuthProvider.LOCAL });
  }

  async findAllLocalPaginated(
    query: FindUsersQueryDto,
  ): Promise<PaginatedUsers> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.provider = :provider', { provider: AuthProvider.LOCAL });

    if (query.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${query.email}%`,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return { data, total, page, perPage };
  }

  async updateLocalUser(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findLocalUserById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Este e-mail já está em uso.');
      }
      user.email = dto.email;
    }

    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    return this.usersRepository.save(user);
  }

  async deleteLocalUser(id: string): Promise<void> {
    const result = await this.usersRepository.delete({
      id,
      provider: AuthProvider.LOCAL,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado.');
    }
  }
}
