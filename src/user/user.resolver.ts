import { Args, Mutation, Query } from "@nestjs/graphql";
import { Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { UserProfileInput, UserProfileOutput } from "./dtos/user-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";

@Resolver(of => User)
export class UserResolver {
	constructor(private readonly userService: UserService) { }

	@Mutation(returns => CreateAccountOutput)
	createAccount(@Args('input') createAccountInput: CreateAccountInput): Promise<CreateAccountOutput> {
		return this.userService.createAccount(createAccountInput);
	}

	@Mutation(returns => LoginOutput)
	login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
		return this.userService.login(loginInput);
	}

	@Mutation(returns => VerifyEmailOutput)
	verifyEmail(@Args('input') { code }: VerifyEmailInput): Promise<VerifyEmailOutput> {
		return this.userService.verifyEmail(code);
	}

	@Query(returns => User)
	@Role(['Any'])
	me(@AuthUser() authUser: User) {
		return authUser;
	}

	@Query(returns => UserProfileOutput)
	@Role(['Any'])
	userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
		return this.userService.userProfile(userProfileInput.id);
	}

	@Mutation(returns => EditProfileOutput)
	@Role(['Any'])
	editProfile(
		@AuthUser() { id }: User, 
		@Args('input') editProfileInput: EditProfileInput
	): Promise<EditProfileOutput> {
		return this.userService.editProfile(id, editProfileInput);
	}
}