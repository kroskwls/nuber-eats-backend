import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { UserProfileOutput } from "./dtos/user-profile.dto";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		@InjectRepository(Verification)
		private readonly verificationRepository: Repository<Verification>,
		private readonly jwtService: JwtService,
		private readonly mailService: MailService,
	) { }

	async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
		try {
			// email exist check
			const exists = await this.userRepository.findOne({ email });
			if (exists) {
				return { ok: false, error: 'There is a user with that email already.' };
			}

			// password hashing
			const user = await this.userRepository.save(
				this.userRepository.create({ email, password, role }) // before password hashing
			); // password hashing before insert

			// create email verification
			const verification = await this.verificationRepository.save(
				this.verificationRepository.create({ user })
			);

			// send verification email
			this.mailService.sendVerificationEmail(user.email, verification.code);
			return { ok: true };
		} catch (e) {
			console.log(e);
			return { ok: false, error: 'Couldn\'t create account.' };
		}
	}

	async login({ email, password }: LoginInput): Promise<LoginOutput> {
		try {
			// find the user with the email
			const user = await this.userRepository.findOne({ email }, { select: ['id', 'password'] });
			if (!user) {
				return { ok: false, error: 'User not found.' };
			}

			// check if the password is correct
			const passwordCorrect = await user.checkPassword(password);
			if (!passwordCorrect) {
				return { ok: false, error: 'Wrong password.' };
			}

			// make a JWT and give it to the user
			const token = this.jwtService.sign(user.id);
			return { ok: true, token };
		} catch (error) {
			return { ok: false, error };
		}
	}

	async findOne(id: number): Promise<User> {
		return await this.userRepository.findOne({ id });
	}

	async userProfile(id: number): Promise<UserProfileOutput> {
		try {
			const user = await this.findOne(id);
			return { ok: true, user };
		} catch (error) {
			return { ok: false, error: 'User not found.' };
		}
	}

	async editProfile(id: number, { email, password }: EditProfileInput): Promise<EditProfileOutput> {
		try {
			const user = await this.findOne(id);
			if (email) {
				// email exist check
				const exists = await this.userRepository.findOne({ email });
				if (exists) {
					return { ok: false, error: 'There is a user with that email already.' };
				}

				user.email = email;
				user.verified = false;
				
				// delete all verification before created by user id
				await this.verificationRepository.delete({ user: { id }});

				const verification = await this.verificationRepository.save(
					this.verificationRepository.create({ user })
				);

				this.mailService.sendVerificationEmail(user.email, verification.code);
			}
			if (password) {
				user.password = password;
			}
			await this.userRepository.save(user);
			return { ok: true };
		} catch (error) {
			return { ok: false, error: 'Could not update profile.' };
		}
	}

	async verifyEmail(code: string): Promise<VerifyEmailOutput> {
		try {
			const verification = await this.verificationRepository.findOne({ code }, { relations: ['user'] });
			if (verification) {
				verification.user.verified = true;
				await this.userRepository.save(verification.user);
				await this.verificationRepository.delete(verification.id);

				return { ok: true };
			}
			return { ok: false, error: 'Verification not found.' };
		} catch (error) {
			return { ok: false, error: 'Could not verify email' };
		}
	}
}