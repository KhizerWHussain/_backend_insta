import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import UserController from './user.controller';
import DatabaseModule from 'src/database/database.module';
import AuthModule from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
