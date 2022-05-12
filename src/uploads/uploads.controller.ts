import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import * as AWS from 'aws-sdk';

@Controller('uploads')
export class UploadsController {
	constructor(private readonly configService: ConfigService) {}

	@Post('')
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(@UploadedFile() file) {
		const BUCKET_NAME = this.configService.get('AWS_BUCKET_NAME');
		AWS.config.update({
			credentials: {
				accessKeyId: this.configService.get('AWS_KEY'),
				secretAccessKey: this.configService.get('AWS_SECRET')
			}
		});

		try {
			const objectname = `${Date.now()}-${file.originalname.replace(/ /g, '_').replace(/'/g, '').replace(/\(/g, '').replace(/\)/g, '')}`;
			console.log('upload file name: ', objectname);
			await new AWS.S3().putObject({ 
				Bucket: BUCKET_NAME,
				Body: file.buffer,
				Key: objectname,
				ACL: 'public-read'
			}).promise();

			const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectname}`;
			return { url };
		} catch (error) {
			console.log(error);
		}
	}
}