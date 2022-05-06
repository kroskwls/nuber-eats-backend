import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/user/entities/verification.entity';


jest.mock('got', () => {
	return {
		post: jest.fn()
	};
});

const GRAPHQL_ENDPOINT = '/graphql'
const testUser = {
	email: 'krosk@naver.com',
	password: '12345'
};

describe('UserModule (e2e)', () => {
	let app: INestApplication;
	let userRepository: Repository<User>;
	let verificationRepository: Repository<Verification>;
	let jwtToken: string;

	const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
	const publicTest = (query: string) => baseTest().send({ query });
	const privateTest = (query: string) => baseTest().set('X-JWT', jwtToken).send({ query });

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = module.createNestApplication();
		userRepository = module.get<Repository<User>>(getRepositoryToken(User));
		verificationRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
		await app.init();
	});

	afterAll(async () => {
		await getConnection().dropDatabase();
		app.close();
	});

	describe('createAccount', () => {
		it('should create account', () => {
			return publicTest(`
					mutation {
						createAccount(input: {
							email: "${testUser.email}",
							password: "${testUser.password}",
							role: Owner
						}) {
							ok
							error
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const createAccount = res.body.data.createAccount;
					expect(createAccount.ok).toBe(true);
					expect(createAccount.error).toBe(null);
				});
		});

		it('should fail if account already exists', () => {
			return publicTest(`
					mutation {
						createAccount(input: {
							email: "${testUser.email}",
							password: "${testUser.password}",
							role: Owner
						}) {
							ok
							error
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const createAccount = res.body.data.createAccount;
					expect(createAccount.ok).toBe(false);
					expect(createAccount.error).toEqual(expect.any(String));
					expect(createAccount.error).toBe('There is a user with that email already.');
				});
		});
	});

	describe('login', () => {
		it('should login with correct credentials', () => {
			return publicTest(`
					mutation{
						login(input: {
							email: "${testUser.email}",
							password: "${testUser.password}",
						}) {
							ok
							error
							token
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const login = res.body.data.login;
					expect(login.ok).toBe(true);
					expect(login.error).toBe(null);
					expect(login.token).toEqual(expect.any(String));
					jwtToken = login.token;
				});
		});

		it('should not be able to login with wrong credentials', () => {
			return publicTest(`
					mutation{
						login(input: {
							email: "${testUser.email}",
							password: "11111",
						}) {
							ok
							error
							token
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const data = res.body.data.login;
					expect(data.ok).toBe(false);
					expect(data.error).toEqual(expect.any(String));
					expect(data.error).toBe('Wrong password.');
					expect(data.token).toBe(null);
				});
		});
	});

	describe('userProfile', () => {
		let userId: number;

		beforeAll(async () => {
			const [{ id }] = await userRepository.find();
			userId = id;
		});

		it('should see a user\'s profile', () => {
			return privateTest(`
					{
						userProfile(id: ${userId}) {
							ok
							error
							user {
								id
								email
								role
								verified
							}
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const userProfile = res.body.data.userProfile;
					expect(userProfile.ok).toBe(true);
					expect(userProfile.error).toBe(null);
					expect(userProfile.user.id).toBe(userId);
				});
		});

		it('should not find a profile', () => {
			return privateTest(`
					{
						userProfile(id: 222) {
							ok
							error
							user {
								id
								email
								role
								verified
							}
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const userProfile = res.body.data.userProfile;
					expect(userProfile.ok).toBe(false);
					expect(userProfile.error).toBe('User not found.');
					expect(userProfile.user).toBe(null);
				});
		});
	});

	describe('me', () => {
		it('should see the my profile', () => {
			return privateTest(`
					{
						me {
							email
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const me = res.body.data.me;
					expect(me.email).toBe(testUser.email);
				});
		});

		it('should not allow logged out user', () => {
			return publicTest(`
					{
						me {
							email
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const [error] = res.body.errors;
					expect(error.data).toBe(undefined);
					expect(error.message).toBe('Forbidden resource');
				});
		});
	});

	describe('editProfile', () => {
		const NEW_EMAIL = 'new@email.com';

		it('should change email', () => {
			return privateTest(`
					mutation{
						editProfile(input: {
							email: "${NEW_EMAIL}"
						}) {
							ok
							error
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const editProfile = res.body.data.editProfile;
					expect(editProfile.ok).toBe(true);
					expect(editProfile.error).toBe(null);
				});
		});

		it('should have new email', () => {
			return privateTest(`
					{
						me {
							email
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const me = res.body.data.me;
					expect(me.email).toBe(NEW_EMAIL);
				});
		});
	});

	describe('verifyEmail', () => {
		let verificationCode: string;

		beforeAll(async () => {
			const [{ code }] = await verificationRepository.find();
			verificationCode = code;
		});

		it('should verify email', () => {
			return publicTest(`
					mutation {
						verifyEmail(input: { code: "${verificationCode}" }) {
							ok
							error
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const verifyEmail = res.body.data.verifyEmail;
					expect(verifyEmail.ok).toBe(true);
					expect(verifyEmail.error).toBe(null);
				});
		});

		it('should fail on wrong verification code', () => {
			return publicTest(`
					mutation {
						verifyEmail(input: { code: "wrongcode" }) {
							ok
							error
						}
					}
				`)
				.expect(200)
				.expect(res => {
					const verifyEmail = res.body.data.verifyEmail;
					expect(verifyEmail.ok).toBe(false);
					expect(verifyEmail.error).toBe('Verification not found.');
				});
		});
	});
});

