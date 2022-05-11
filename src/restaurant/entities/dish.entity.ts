import { Field, Float, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsNumber, IsString } from "class-validator";
import { CommonEntity } from "src/common/entities/common.entity";
import { Column, Entity, ManyToOne, RelationId } from "typeorm";
import { Restaurant } from "./restaurant.entity";

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CommonEntity {
	@Field(type => String)
	@Column()
	@IsString()
	name: string;

	@Field(type => Number)
	@Column('numeric')
	@IsNumber()
	price: number;

	@Field(type => String, { nullable: true })
	@Column({ nullable: true })
	photo?: string;

	@Field(type => String)
	@Column()
	description: string;

	@Field(type => Restaurant)
	@ManyToOne(
		type => Restaurant,
		restaurant => restaurant.menu,
		{ onDelete: 'CASCADE', nullable: false }
	)
	restaurant: Restaurant;

	@Field(type => Int)
	@RelationId((dish: Dish) => dish.restaurant)
	restaurantId: number;

	@Field(type => [DishOption], { nullable: true })
	@Column({ type: 'json', nullable: true })
	options?: DishOption[];
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
	@Field(type => String)
	name: string;

	@Field(type => [OptionChoice], { nullable: true })
	choices?: OptionChoice[];

	@Field(type => Number, { nullable: true })
	extra?: number;
}

@InputType('OptionChoiceInputType', { isAbstract: true })
@ObjectType()
export class OptionChoice {
	@Field(type => String)
	name: string;

	@Field(type => Number, { nullable: true })
	extra?: number;
}