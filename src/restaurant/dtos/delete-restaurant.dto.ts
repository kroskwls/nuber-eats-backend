import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class DeleteRestaurantInput {
	@Field(type => Number)
	restaurantId: number;
};

@ObjectType()
export class DeleteRestaurantOutput extends CommonOutput { };