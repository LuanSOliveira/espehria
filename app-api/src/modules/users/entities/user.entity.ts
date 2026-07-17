import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AuthProvider } from '../enums/auth-provider.enum';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  email!: string;

  @ApiProperty()
  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  password!: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index({ unique: true, where: '"googleId" IS NOT NULL' })
  googleId!: string | null;

  @ApiProperty({ enum: AuthProvider })
  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  provider!: AuthProvider;
}
