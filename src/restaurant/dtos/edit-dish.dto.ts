import { Field, InputType, Int, ObjectType, PartialType, PickType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Dish } from "../entities/dish.entity";

@InputType()
export class EditDishInput extends PartialType(PickType(Dish, ['name', 'options', 'price', 'description', 'photo'])) {
	@Field(type => Int)
	dishId: number;
}

@ObjectType()
export class EditDishOutput extends CommonOutput { }