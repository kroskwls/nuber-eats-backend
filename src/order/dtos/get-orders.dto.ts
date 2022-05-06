import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Order, OrderStatus } from "../entities/order.entity";

@InputType()
export class GetOrdersInputType {
	@Field(type => OrderStatus, { nullable: true })
	status?: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends CommonOutput {
	@Field(type => [Order], { nullable: true })
	orders?: Order[];
}