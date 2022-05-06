import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { UserService } from "./user.service";

const mockRepository = () => ({
	findOne: jest.fn(),
	create: jest.fn(),
	save: jest.fn(),
	delete: jest.fn(),
	update: jest.fn(),
	findOneOrFail: jest.fn(),
});

const mockJwtService = () => ({
	sign: jest.fn(() => expect.any(String)),
	verify: jest.fn(),
});

const mockMailService = () => ({
	sendVerificationEmail: jest.fn()
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe("UserService", () => {
	let service: UserService;
	let userRepository: MockRepository<User>;
	let verificationRepository: MockRepository<Verification>;
	let mailService: MailService;
	let jwtService: JwtService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: getRepositoryToken(User),
					useValue: mockRepository()
				}, {
					provide: getRepositoryToken(Verification),
					useValue: mockRepository()
				}, {
					provide: JwtService,
					useValue: mockJwtService()
				}, {
					provide: MailService,
					useValue: mockMailService()
				}
			],
		}).compile();
		service = module.get<UserService>(UserService);
		mailService = module.get<MailService>(MailService);
		jwtService = module.get<JwtService>(JwtService);
		userRepository = module.get(getRepositoryToken(User));
		verificationRepository = module.get(getRepositoryToken(Verification));
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createAccount', () => {
		const createAccountInput = {
			email: 'fake@email.com',
			password: 'fakepassword',
			role: UserRole.Client
		};
		const fakeUser = {
			id: 1,
			...createAccountInput
		};
		const fakeVerification = {
			id: 1,
			code: 'fakecode',
			user: fakeUser
		};

		it('should fail if user exists', async () => {
			userRepository.findOne.mockResolvedValue(fakeUser);

			const result = await service.createAccount(createAccountInput);
			expect(result).toMatchObject({ ok: false, error: 'There is a user with that email already.' });
		});

		it('should create a new user', async () => {
			userRepository.findOne.mockResolvedValue(undefined);
			userRepository.create.mockReturnValue(createAccountInput);
			userRepository.save.mockResolvedValue(fakeUser);
			verificationRepository.create.mockReturnValue({ user: fakeUser });
			verificationRepository.save.mockResolvedValue(fakeVerification);

			const result = await service.createAccount(createAccountInput);
			expect(userRepository.create).toHaveBeenCalledTimes(1);
			expect(userRepository.create).toHaveBeenCalledWith(createAccountInput);

			expect(userRepository.save).toHaveBeenCalledTimes(1);
			expect(userRepository.save).toHaveBeenCalledWith(createAccountInput);

			expect(verificationRepository.create).toHaveBeenCalledTimes(1);
			expect(verificationRepository.create).toHaveBeenCalledWith({ user: fakeUser });

			expect(verificationRepository.save).toHaveBeenCalledTimes(1);
			expect(verificationRepository.save).toHaveBeenCalledWith({ user: fakeUser });

			expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
			expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(expect.any(String), expect.any(String));

			expect(result).toEqual({ ok: true });
		});

		it('should fail on exception', async () => {
			userRepository.findOne.mockRejectedValue(new Error());

			const result = await service.createAccount(createAccountInput);
			expect(result).toEqual({ ok: false, error: 'Couldn\'t create account.' });
		});
	});

	describe('login', () => {
		const loginInput = {
			email: 'fake@email.com',
			password: 'fakepassword'
		};
		const fakeUser = {
			id: 1,
			checkPassword: jest.fn()
		};

		it('should fail if user does not exist', async () => {
			userRepository.findOne.mockResolvedValue(undefined);

			const result = await service.login(loginInput);
			expect(userRepository.findOne).toHaveBeenCalledTimes(1);
			expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
			expect(result).toEqual({ ok: false, error: 'User not found.' });
		});

		it('should fail if the password is wrong', async () => {
			userRepository.findOne.mockResolvedValue(fakeUser);
			fakeUser.checkPassword.mockResolvedValue(false);

			const result = await service.login(loginInput);
			expect(result).toEqual({ ok: false, error: 'Wrong password.' });
		});

		it('should return token if password correct', async () => {
			userRepository.findOne.mockResolvedValue(fakeUser);
			fakeUser.checkPassword.mockResolvedValue(true);

			const result = await service.login(loginInput);
			expect(jwtService.sign).toHaveBeenCalledTimes(1);
			expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
			expect(result).toEqual({ ok: true, token: expect.any(String) });
		});

		it('should fail on exception', async () => {
			userRepository.findOne.mockRejectedValue(new Error());

			const result = await service.login(loginInput);
			expect(result).toEqual({ ok: false, error: expect.any(Error) });
		});
	});

	describe('userProfile', () => {
		const fakeUser = {
			id: 1
		};

		it('should find an existing user', async () => {
			userRepository.findOneOrFail.mockResolvedValue(fakeUser);

			const result = await service.userProfile(1);
			expect(result).toEqual({ ok: true, user: fakeUser });
		});

		it('should fail if user is not found', async () => {
			userRepository.findOneOrFail.mockRejectedValue(new Error());

			const result = await service.userProfile(1);
			expect(result).toEqual({ ok: false, error: 'User not found.' });
		});
	});

	describe('editProfile', () => {

		it('should change email', async () => {
			const fakeId = 1;
			const oldUser = {
				email: 'old@email.com',
				verified: true
			};
			const newVerification = {
				code: 'fakeCode'
			};
			const editProfileInput = {
				email: 'new@email.com'
			};
			const newUser = {
				verified: false,
				email: editProfileInput.email
			};
			userRepository.findOneOrFail.mockResolvedValue(oldUser);
			verificationRepository.create.mockReturnValue(newVerification);
			verificationRepository.save.mockResolvedValue(newVerification);

			const result = await service.editProfile(fakeId, editProfileInput);
			expect(userRepository.findOneOrFail).toHaveBeenCalledTimes(1);
			expect(userRepository.findOneOrFail).toHaveBeenCalledWith({ id: fakeId });

			expect(verificationRepository.create).toHaveBeenCalledWith({ user: newUser });
			expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

			expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(newUser.email, newVerification.code);

			expect(userRepository.save).toHaveBeenCalledTimes(1);
			expect(userRepository.save).toHaveBeenCalledWith(newUser);

			expect(result).toEqual({ ok: true });
		});

		it('should change password', async () => {
			const fakeId = 1;
			const oldUser = {
				password: 'oldPassword'
			};
			const editProfileInput = {
				password: 'newPassword'
			};
			userRepository.findOneOrFail.mockResolvedValue(oldUser);

			const result = await service.editProfile(fakeId, editProfileInput);
			expect(userRepository.save).toHaveBeenCalledTimes(1);
			expect(userRepository.save).toHaveBeenCalledWith(editProfileInput);

			expect(result).toEqual({ ok: true });
		});

		it('should fail on exception', async () => {
			userRepository.findOneOrFail.mockRejectedValue(new Error());

			const result = await service.editProfile(1, { email: 'fake' });
			expect(result).toEqual({ ok: false, error: 'Could not update profile.' });
		});
	});

	describe('verifyEmail', () => {
		const fakeCode = 'fakeCode';

		it('should verify email', async () => {
			const verification = {
				id: 1,
				user: {
					verified: false
				}
			};
			verificationRepository.findOne.mockResolvedValue(verification);

			const result = await service.verifyEmail(fakeCode);
			expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
			expect(verificationRepository.findOne).toHaveBeenCalledWith(
				{ code: fakeCode }, expect.any(Object)
			);

			expect(userRepository.save).toHaveBeenCalledTimes(1);
			expect(userRepository.save).toHaveBeenCalledWith({ verified: true });

			expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
			expect(verificationRepository.delete).toHaveBeenCalledWith(verification.id);

			expect(result).toEqual({ ok: true });
		});

		it('should fail on verification not found', async () => {
			verificationRepository.findOne.mockResolvedValue(undefined);

			const result = await service.verifyEmail(fakeCode);
			expect(result).toEqual({ ok: false, error: 'Verification not found.' });
		});

		it('should fail on exception', async () => {
			verificationRepository.findOne.mockRejectedValue(new Error());

			const result = await service.verifyEmail(fakeCode);
			expect(result).toEqual({ ok: false, error: 'Could not verify email' });
		});
	});
});