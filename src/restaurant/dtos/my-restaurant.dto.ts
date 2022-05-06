import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Restaurant } from "../entities/restaurant.entity";

@InputType()
export class MyRestaurantInput extends PickType(Restaurant, ['id']) { }

@ObjectType()
export class MyRestaurantOutput extends CommonOutput {
	@Field(type => Restaurant, { nullable: true })
	restaurant?: Restaurant;
}