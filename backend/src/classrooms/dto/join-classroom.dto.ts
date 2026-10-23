import { IsNotEmpty, IsString } from 'class-validator';

export class JoinClassroomDto {
  @IsString()
  @IsNotEmpty()
  joinCode!: string;
}
