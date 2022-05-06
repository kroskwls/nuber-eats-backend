import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/user/entities/user.entity';
import { CreatePaymentInput, CreatePaymentOutput } from './dto/create-payment.dto';
import { GetPaymentsOutput } from './dto/get-payments.dto';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

@Resolver(of => Payment)
export class PaymentsResolver {
	constructor(
		private readonly paymentService: PaymentsService
	) { }

	@Mutation(returns => CreatePaymentOutput)
	@Role(['Owner'])
	createPayment(
		@AuthUser() user: User,
		@Args('input') input: CreatePaymentInput
	): Promise<CreatePaymentOutput> {
		return this.paymentService.createPayment(user, input);
	}

	@Query(returns => GetPaymentsOutput)
	@Role(['Owner'])
	getPayments(
		@AuthUser() user: User
	): Promise<GetPaymentsOutput> {
		return this.paymentService.getPayments(user);
	}
}
