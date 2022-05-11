import { InputType, ObjectType, PickType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Dish } from "../entities/dish.entity";

@InputType()
export class CreateDishInput extends PickType(Dish, ['name', 'price', 'description', 'options', 'restaurantId', 'photo']) { }

@ObjectType()
export class CreateDishOutput extends CommonOutput { }