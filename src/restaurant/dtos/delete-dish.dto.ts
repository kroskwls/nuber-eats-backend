import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";

@InputType()
export class DeleteDishInput {
	@Field(type => Int)
	dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CommonOutput { }