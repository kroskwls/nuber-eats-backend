import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString } from "class-validator";
import { CommonEntity } from "src/common/entities/common.entity";
import { Order } from "src/order/entities/order.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, OneToMany, RelationId } from "typeorm";
import { Category } from "./category.entity";
import { Dish } from "./dish.entity";

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CommonEntity {
	@Field(type => String)
	@Column()
	@IsString()
	name: string;

	@Field(type => String)
	@Column()
	@IsString()
	coverImage: string;

	@Field(type => String)
	@Column()
	@IsString()
	address: string;

	@Field(type => Category, { nullable: true })
	@ManyToOne(
		type => Category,
		category => category.restaurants,
		{ nullable: true, onDelete: 'SET NULL', eager: true }
	)
	category: Category;

	@Field(type => User)
	@ManyToOne(
		type => User,
		user => user.restaurants,
		{ onDelete: 'CASCADE' }
	)
	owner: User;

	@RelationId((restaurant: Restaurant) => restaurant.owner)
	ownerId: number;

	@Field(type => [Dish], { nullable: true })
	@OneToMany(
		type => Dish,
		dish => dish.restaurant,
		{ nullable: true }
	)
	menu?: Dish[];

	@Field(type => [Order], { nullable: true })
	@OneToMany(
		type => Order,
		order => order.restaurant,
		{ nullable: true }
	)
	orders?: Order[];

	@Field(type => Boolean)
	@Column({ default: false })
	isPromoted: boolean;

	@Field(type => Date, { nullable: true })
	@Column({ nullable: true })
	promotedUntil?: Date;
};