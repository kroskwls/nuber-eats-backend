import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Restaurant } from "../entities/restaurant.entity";

@ObjectType()
export class MyRestaurantsOutput extends CommonOutput {
	@Field(type => [Restaurant], { nullable: true })
	restaurants?: Restaurant[];
}