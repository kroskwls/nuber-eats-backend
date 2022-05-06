import { Field, InputType, ObjectType, PickType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Order } from "../entities/order.entity";

@InputType()
export class GetOneOrderInput extends PickType(Order, ['id']) { }

@ObjectType()
export class GetOneOrderOutput extends CommonOutput {
	@Field(type => Order, { nullable: true })
	order?: Order;
}