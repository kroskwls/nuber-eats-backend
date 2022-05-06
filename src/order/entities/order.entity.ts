import { Field, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsNumber } from "class-validator";
import { CommonEntity } from "src/common/entities/common.entity";
import { Dish } from "src/restaurant/entities/dish.entity";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, RelationId } from "typeorm";
import { OrderItem } from "./order-item.entity";

export enum OrderStatus {
	Pending = 'Pending',
	Cooking = 'Cooking',
	Cooked = 'Cooked',
	PickedUp = 'PickedUp',
	Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CommonEntity {
	@Field(type => User, { nullable: true })
	@ManyToOne(
		type => User,
		user => user.orders,
		{ onDelete: 'SET NULL', nullable: true, eager: true }
	)
	customer?: User;

	@RelationId((order: Order) => order.customer)
	customerId: number;

	@Field(type => User, { nullable: true })
	@ManyToOne(
		type => User,
		user => user.rides,
		{ onDelete: 'SET NULL', nullable: true, eager: true }
	)
	driver?: User;

	@RelationId((order: Order) => order.driver)
	driverId: number;

	@Field(type => Restaurant, { nullable: true })
	@ManyToOne(
		type => Restaurant,
		restaurant => restaurant.orders,
		{ onDelete: 'SET NULL', nullable: true, eager: true }
	)
	restaurant?: Restaurant;

	@Field(type => [OrderItem])
	@ManyToMany(type => OrderItem, { eager: true })
	@JoinTable()
	items: OrderItem[];

	@Field(type => Number, { nullable: true })
	@Column({ nullable: true })
	@IsNumber()
	total?: number;

	@Field(type => OrderStatus)
	@Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
	@IsEnum(OrderStatus)
	status: OrderStatus;
}