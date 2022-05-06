import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";
import { PaginationInput, PaginationOutput } from "./pagination.dto";

@InputType()
export class AllRestaurantInput extends PaginationInput { }

@ObjectType()
export class AllRestaurantOutput extends PaginationOutput {
	@Field(type => [Restaurant], { nullable: true })
	results?: Restaurant[];
}