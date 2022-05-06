import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { CommonEntity } from "src/common/entities/common.entity";
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { User } from "./user.entity";
import { v4 as uuid } from 'uuid';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CommonEntity {
	@Column()
	@Field(type => String)
	code: string;

	@OneToOne(type => User, { onDelete: 'CASCADE' })
	@JoinColumn()
	user: User;

	@BeforeInsert()
	createCode(): void {
		this.code = uuid().replace(/-/g, '');
	}
}