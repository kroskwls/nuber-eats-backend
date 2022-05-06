import { Field, ObjectType } from "@nestjs/graphql";
import { CommonOutput } from "src/common/dtos/common-output.dto";
import { Category } from "../entities/category.entity";

@ObjectType()
export class AllCategoriesOutput extends CommonOutput {
	@Field(type => [Category], { nullable: true })
	categories?: Category[];
}