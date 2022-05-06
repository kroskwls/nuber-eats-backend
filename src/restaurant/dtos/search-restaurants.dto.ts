import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";
import { PaginationInput, PaginationOutput } from "./pagination.dto";

@InputType()
export class SearchRestaurantsInput extends PaginationInput {
	@Field(type => String)
	query: string;
}

@ObjectType()
export class SearchRestaurantsOutput extends PaginationOutput {
	@Field(type => [Restaurant], { nullable: true })
	restaurants?: Restaurant[];
}
