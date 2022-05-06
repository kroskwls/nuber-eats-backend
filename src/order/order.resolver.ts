import { Inject } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from 'src/common/common.constants';
import { User } from 'src/user/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOneOrderInput, GetOneOrderOutput } from './dtos/get-one-order.dto';
import { GetOrdersInputType, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdatesInput } from './dtos/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

@Resolver(of => Order)
export class OrderResolver {
	constructor(
		private readonly ordersService: OrderService,
		@Inject(PUB_SUB)
		private readonly pubSub: PubSub
	) { }

	@Mutation(returns => CreateOrderOutput)
	@Role(['Client'])
	createOrder(
		@AuthUser() customer: User,
		@Args('input') input: CreateOrderInput
	): Promise<CreateOrderOutput> {
		return this.ordersService.createOrder(customer, input);
	}

	@Query(returns => GetOrdersOutput)
	@Role(['Any'])
	getOrders(
		@AuthUser() user: User,
		@Args('input') input: GetOrdersInputType
	): Promise<GetOrdersOutput> {
		return this.ordersService.getOrders(user, input);
	}

	@Query(returns => GetOneOrderOutput)
	@Role(['Any'])
	getOneOrder(
		@AuthUser() user: User,
		@Args('input') input: GetOneOrderInput
	): Promise<GetOneOrderOutput> {
		return this.ordersService.getOneOrder(user, input);
	}

	@Mutation(returns => EditOrderOutput)
	@Role(['Owner', 'Delivery'])
	editOrder(
		@AuthUser() user: User,
		@Args('input') input: EditOrderInput
	): Promise<EditOrderOutput> {
		return this.ordersService.editOrder(user, input);
	}

	@Subscription(returns => Order, {
		filter: ({ pendingOrders: { ownerId } }, _, { user }) => ownerId === user.id,
		resolve: ({ pendingOrders: { order } }) => order
	})
	@Role(['Owner'])
	pendingOrders() {
		return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
	}

	@Subscription(returns => Order)
	@Role(['Delivery'])
	cookedOrders() {
		return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
	}

	@Subscription(returns => Order, {
		filter: ({ orderUpdates: order }, { input }, { user }) => {
			const ids = [order.driverId, order.customerId, order.restaurant.ownerId];
			return ids.includes(user.id) && order.id === input.id;
			
			// if (!ids.includes(user.id)) {
			// 	return false;
			// }
			// return order.id === input.id;
		}
	})
	@Role(['Any'])
	orderUpdates(@Args('input') input: OrderUpdatesInput) {
		return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
	}

	@Mutation(returns => TakeOrderOutput)
	@Role(['Delivery'])
	takeOrder(
		@AuthUser() driver: User,
		@Args('input') input: TakeOrderInput
	): Promise<TakeOrderOutput> {
		return this.ordersService.takeOrder(driver, input);
	}
}
