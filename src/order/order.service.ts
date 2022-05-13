import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { Dish } from 'src/restaurant/entities/dish.entity';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOneOrderInput, GetOneOrderOutput } from './dtos/get-one-order.dto';
import { GetOrdersInputType, GetOrdersOutput } from './dtos/get-orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@InjectRepository(Restaurant)
		private readonly restaurantRepository: Repository<Restaurant>,
		@InjectRepository(OrderItem)
		private readonly orderItemRepository: Repository<OrderItem>,
		@InjectRepository(Dish)
		private readonly dishRepository: Repository<Dish>,
		@Inject(PUB_SUB)
		private readonly pubSub: PubSub,
	) { }

	async createOrder(customer: User, { restaurantId, items }: CreateOrderInput): Promise<CreateOrderOutput> {
		try {
			const restaurant = await this.restaurantRepository.findOne(restaurantId);
			if (!restaurant) {
				return { ok: false, error: 'Could not found restaurant.' };
			}

			const orderItems: OrderItem[] = [];
			let total = 0;
			for (const { dishId, options } of items) {
				const dish = await this.dishRepository.findOne(dishId);
				if (!dish) {
					return { ok: false, error: 'Could not found dish.' };
				}

				let dishPrice = Number(dish.price);
				for (const { name, choice } of options) {
					const dishOption = dish.options.find(dishOption => dishOption.name === name);
					dishPrice += Number(dishOption.extra ?? 0);
					if (choice) {
						const dishChoice = dishOption.choices?.find(dishChoice => dishChoice.name === choice);
						dishPrice += Number(dishChoice.extra ?? 0);
					}
				}
				total += Number(dishPrice);
				const orderItem = await this.orderItemRepository.save(
					this.orderItemRepository.create({ dish, options })
				);
				orderItems.push(orderItem);
			}

			const order = await this.orderRepository.save(
				this.orderRepository.create({
					customer,
					restaurant,
					total,
					items: orderItems
				})
			);

			await this.pubSub.publish(NEW_PENDING_ORDER, {
				pendingOrders: { order, ownerId: restaurant.ownerId }
			});
			// await this.pubSub.publish(NEW_PENDING_ORDER, { pendingOrders: { ...order, ownerId: restaurant.ownerId } });

			return { ok: true, orderId: order.id };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not create order.' };
		}
	}

	async getOrders(user: User, { status }: GetOrdersInputType): Promise<GetOrdersOutput> {
		try {
			let orders: Order[];
			switch (user.role) {
				case UserRole.Client:
					orders = await this.orderRepository.find({
						where: {
							customer: user,
							...(status && { status })
						}
					});
					break;
				case UserRole.Delivery:
					orders = await this.orderRepository.find({
						where: {
							driver: user,
							...(status && { status })
						}
					});
					break;
				case UserRole.Owner:
					const restaurants = await this.restaurantRepository.find({
						where: {
							owner: user
						},
						relations: ['orders']
					});
					orders = restaurants.map(restaurant => restaurant.orders).flat(1);
					if (status) {
						orders = orders.filter(order => order.status === status);
					}
					break;
			}

			return { ok: true, orders };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not get order.' };
		}
	}

	canSeeOrder(user: User, order: Order): boolean {
		let ok = true;

		if (user.role === UserRole.Client && user.id !== order.customerId) {
			ok = false;
		}
		if (user.role === UserRole.Delivery && user.id !== order.driverId) {
			ok = false;
		}
		if (user.role === UserRole.Owner && user.id !== order.restaurant.ownerId) {
			ok = false;
		}

		return ok;
	}

	async getOneOrder(user: User, { id: orderId }: GetOneOrderInput): Promise<GetOneOrderOutput> {
		try {
			const order = await this.orderRepository.findOne(orderId, { relations: ['restaurant'] });
			if (!order) {
				return { ok: false, error: 'Could not found order.' };
			}
			if (!this.canSeeOrder(user, order)) {
				return { ok: false, error: 'You can not see order' };
			}

			return { ok: true, order };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not get order.' };
		}
	}

	async editOrder(user: User, { id: orderId, status }: EditOrderInput): Promise<EditOrderOutput> {
		try {
			const order = await this.orderRepository.findOne(orderId);
			if (!order) {
				return { ok: false, error: 'Could not found order.' };
			}
			if (!this.canSeeOrder(user, order)) {
				return { ok: false, error: 'You can not see order' };
			}

			let canEdit = true;
			if (user.role === UserRole.Owner) {
				if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
					canEdit = false;
				}
			}
			if (user.role === UserRole.Delivery) {
				if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
					canEdit = false;
				}
			}
			if (!canEdit) {
				return { ok: false, error: 'You can not edit order.' };
			}

			await this.orderRepository.save({
				id: orderId,
				status
			});

			const updatedOrder = { ...order, status };
			if (user.role === UserRole.Owner) {
				if (status === OrderStatus.Cooked) {
					await this.pubSub.publish(NEW_COOKED_ORDER, {
						cookedOrders: updatedOrder
					});
				}
			}

			await this.pubSub.publish(NEW_ORDER_UPDATE, {
				orderUpdates: updatedOrder
			});

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not get order.' };
		}
	}

	async takeOrder(driver: User, { id: orderId }: TakeOrderInput): Promise<TakeOrderOutput> {
		try {
			const order = await this.orderRepository.findOne(orderId);
			if (!order) {
				return { ok: false, error: 'Could not found order.' };
			}
			if (order.driver) {
				return { ok: false, error: 'This order already taken.' };
			}

			await this.orderRepository.save({
				id: orderId,
				driver,
			});

			await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: { ...order, driver } });

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not take order.' };
		}
	}
}
