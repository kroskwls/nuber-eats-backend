import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CommonEntity } from "src/common/entities/common.entity";
import { Dish } from "src/restaurant/entities/dish.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
	@Field(type => String)
	name: string;

	@Field(type => String, { nullable: true })
	choice?: String;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CommonEntity {
	@Field(type => Dish)
	@ManyToOne(type => Dish, { nullable: true, onDelete: 'CASCADE' })
	dish: Dish;

	@Field(type => [OrderItemOption], { nullable: true })
	@Column({ type: 'json', nullable: true })
	options?: OrderItemOption[];
}