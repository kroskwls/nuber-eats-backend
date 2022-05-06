import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { User } from 'src/user/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import { CreatePaymentInput, CreatePaymentOutput } from './dto/create-payment.dto';
import { GetPaymentsOutput } from './dto/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
	constructor(
		@InjectRepository(Payment)
		private readonly paymentRepository: Repository<Payment>,
		@InjectRepository(Restaurant)
		private readonly restaurantRepository: Repository<Restaurant>,
		private schedulerRegistry: SchedulerRegistry,
	) { }

	async createPayment(user: User, { transactionId, restaurantId }: CreatePaymentInput): Promise<CreatePaymentOutput> {
		try {
			const restaurant = await this.restaurantRepository.findOne(restaurantId);
			if (!restaurant) {
				return { ok: false, error: 'Could not found restaurant.' };
			}
			if (restaurant.ownerId !== user.id) {
				return { ok: false, error: 'You can not do that.' };
			}

			await this.paymentRepository.save(
				this.paymentRepository.create({
					transactionId,
					restaurant,
					user,
				})
			);

			restaurant.isPromoted = true;
			const date = new Date();
			date.setDate(date.getDate() + 7);
			restaurant.promotedUntil = date;
			this.restaurantRepository.save(restaurant);

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not create payment.' };
		}
	}

	async getPayments(user: User): Promise<GetPaymentsOutput> {
		try {
			const payments = await this.paymentRepository.find({ user });

			return { ok: true, payments };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not load payments.' };
		}
	}

	@Cron('* 59 23 * * *')
	async checkPromotedRestaurants() {
		const restaurants = await this.restaurantRepository.find({
			isPromoted: true,
			promotedUntil: LessThan(new Date())
		});
		restaurants.forEach(async restaurant => {
			restaurant.isPromoted = false;
			restaurant.promotedUntil = null;
			await this.restaurantRepository.save(restaurant);
		});
	}
}
