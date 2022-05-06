import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString } from "class-validator";
import { CommonEntity } from "src/common/entities/common.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { Restaurant } from "./restaurant.entity";

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CommonEntity {
	@Field(type => String)
	@Column({ unique: true })
	@IsString()
	name: string;

	@Field(type => String, { nullable: true })
	@Column({ nullable: true })
	@IsString()
	icon: string;

	@Field(type => String)
	@Column({ unique: true })
	@IsString()
	slug: string;

	@Field(type => [Restaurant], { nullable: true })
	@OneToMany(type => Restaurant, restaurant => restaurant.category)
	restaurants?: Restaurant[];
};