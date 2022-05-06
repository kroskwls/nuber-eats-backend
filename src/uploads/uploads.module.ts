import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsController } from './uploads.controller';

@Module({
	controllers: [UploadsController],
	providers: [ConfigService]
})
export class UploadsModule { }