import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CommonEntity } from 'src/common/entities/common.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Order } from 'src/order/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';

export enum UserRole {
	Client = 'Client',
	Owner = 'Owner',
	Delivery = 'Delivery'
}

registerEnumType(UserRole, { name: 'UserRole' })

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CommonEntity {
	@Column({ unique: true })
	@Field(type => String)
	@IsEmail()
	email: string;

	@Column({ select: false })
	@Field(type => String)
	@IsString()
	password: string;

	@Column({ type: 'enum', enum: UserRole })
	@Field(type => UserRole)
	@IsEnum(UserRole)
	role: UserRole;

	@Column({ default: false })
	@Field(type => Boolean)
	@IsBoolean()
	verified: boolean;

	@Field(type => [Restaurant])
	@OneToMany(type => Restaurant, restaurant => restaurant.owner)
	restaurants: Restaurant[];

	@Field(type => [Order])
	@OneToMany(type => Order, order => order.customer)
	orders: Order[];

	@Field(type => [Payment])
	@OneToMany(type => Payment, payment => payment.user)
	payments: Payment[];

	@Field(type => [User])
	@OneToMany(type => User, user => user.rides)
	rides: User[];

	@BeforeInsert()
	@BeforeUpdate()
	async hashPassword(): Promise<void> {
		if (this.password) {
			try {
				this.password = await bcrypt.hash(this.password, 10);
			} catch (e) {
				console.error(e);
				throw new InternalServerErrorException();
			}
		}
	}

	async checkPassword(aPassword: string): Promise<boolean> {
		try {
			return await bcrypt.compare(aPassword, this.password);
		} catch (e) {
			console.error(e);
			throw new InternalServerErrorException();
		}
	}
}