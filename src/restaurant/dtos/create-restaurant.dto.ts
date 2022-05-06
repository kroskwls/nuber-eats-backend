import { Field, InputType, Int, ObjectType, PickType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, ['name', 'coverImage', 'address']) {
	@Field(type => String)
	categoryName: string;

};

@ObjectType()
export class CreateRestaurantOutput extends CommonOutput {
	@Field(type => Int, { nullable: true })
	restaurantId?: number;
};