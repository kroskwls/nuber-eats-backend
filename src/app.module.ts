import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';
import { JwtModule } from './jwt/jwt.module';
import { Verification } from './user/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { Category } from './restaurant/entities/category.entity';
import { Restaurant } from './restaurant/entities/restaurant.entity';
import { AuthModule } from './auth/auth.module';
import { Dish } from './restaurant/entities/dish.entity';
import { Order } from './order/entities/order.entity';
import { OrderModule } from './order/order.module';
import { OrderItem } from './order/entities/order-item.entity';
import { CommonModule } from './common/common.module';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadsModule } from './uploads/uploads.module';

const TOKEN_KEY = 'x-jwt';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({
			// true인 경우 어떤 service에서든지 접근이 가능하도록 설정
			// false인 경우 해당 module에서 imports해야 사용이 가능함
			isGlobal: false,
			envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
			ignoreEnvFile: process.env.NODE_ENV === 'production',
			validationSchema: Joi.object({
				NODE_ENV: Joi.string().valid('dev', 'production', 'test').required(),
				DB_HOST: Joi.string(),
				DB_PORT: Joi.string(),
				DB_USERNAME: Joi.string(),
				DB_PASSWORD: Joi.string(),
				DB_NAME: Joi.string(),
				PRIVATE_KEY: Joi.string().required(),
				MAILGUN_API_KEY: Joi.string().required(),
				MAILGUN_DOMAIN_NAME: Joi.string().required(),
				MAILGUN_FROM: Joi.string().required(),
			})
		}),
		TypeOrmModule.forRoot({
			type: 'postgres',
			...(
				process.env.DATABASE_URL ? ({
					url: process.env.DATABASE_URL,
				}) : ({
					host: process.env.DB_HOST,
					port: +process.env.DB_PORT,
					username: process.env.DB_USERNAME,
					password: process.env.DB_PASSWORD,
					database: process.env.DB_NAME,
				})
			),
			// synchronize: process.env.NODE_ENV !== 'production',
			synchronize: true,
			// logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
			logging: false,
			entities: [User, Verification, Restaurant, Category, Dish, Order, OrderItem, Payment]
		}),
		GraphQLModule.forRoot({
			// playground 페이지 사용/미사용 할 수 있도록 설정
			introspection: process.env.NODE_ENV !== 'production',
			playground: process.env.NODE_ENV !== 'production',
			// 서버가 WebSocket 기능을 가지도록 함
			installSubscriptionHandlers: true,
			// GraphQL schema를 memory에 위치시켜주는 옵션
			// 경로를 작성할 경우 해당 경로에 schema 파일이 생성됨
			autoSchemaFile: true,
			// 모든 resolver에 정보를 보낼 수 있는 property
			context: ({ req }) => {
				const token = req.headers[TOKEN_KEY];
				return { token };
			},
			subscriptions: {
				'subscriptions-transport-ws': {
					onConnect: (connection) => ({ token: connection[TOKEN_KEY] })
				}
			}
		}),
		JwtModule.forRoot({
			privateKey: process.env.PRIVATE_KEY
		}),
		MailModule.forRoot({
			apiKey: process.env.MAILGUN_API_KEY,
			domain: process.env.MAILGUN_DOMAIN_NAME,
			from: process.env.MAILGUN_FROM,
		}),
		AuthModule,
		UserModule,
		MailModule,
		RestaurantModule,
		OrderModule,
		CommonModule,
		PaymentsModule,
		UploadsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule { }
// export class AppModule implements NestModule {
// 	configure(consumer: MiddlewareConsumer) {
// 		consumer.apply(JwtMiddleware).forRoutes({
// 			path: '/graphql',
// 			method: RequestMethod.POST
// 		});
// 	}
// }