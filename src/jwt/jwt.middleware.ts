import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { UserService } from "src/user/user.service";
import { JwtService } from "./jwt.service";

// Injectable 데코레이터가 있어야 각종 dependency를 constructor에서 inject할 수 있다
@Injectable()
export class JwtMiddleware implements NestMiddleware {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
	) { }

	async use(req: Request, res: Response, next: NextFunction) {
		if ('x-jwt' in req.headers) {
			const token = req.headers['x-jwt'];
			try {
				const decoded = this.jwtService.verify(token.toString());
				if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
					const user = await this.userService.findOne(decoded.id);
					req['user'] = user;
				}
			} catch (e) { }
		}
		next();
	}
}