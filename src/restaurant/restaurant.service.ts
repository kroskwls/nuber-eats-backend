import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { AllRestaurantInput, AllRestaurantOutput } from './dtos/all-restaurants.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantInput, RestaurantOutput } from './dtos/one-restaurant.dto';
import { SearchRestaurantsInput, SearchRestaurantsOutput } from './dtos/search-restaurants.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';
import { MyRestaurantInput, MyRestaurantOutput } from './dtos/my-restaurant.dto';

const rowsInPage = 6;

@Injectable()
export class RestaurantService {
	constructor(
		@InjectRepository(Restaurant)
		private readonly restaurantRepository: Repository<Restaurant>,
		private readonly categoryRepository: CategoryRepository,
		@InjectRepository(Dish)
		private readonly dishRepository: Repository<Dish>,
	) { }

	async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
		try {
			const restaurants = await this.restaurantRepository.find({ owner });
			return { ok: true, restaurants };
		} catch (error) {
			console.log(error);
			return { ok: false, error: 'Could not found restaurants' };
		}
	}

	async myRestaurant(owner: User, { id }: MyRestaurantInput): Promise<MyRestaurantOutput> {
		try {
			const restaurant = await this.restaurantRepository.findOne(
				{ owner, id },
				{ relations: ['menu', 'orders'] }
			);
			return { ok: true, restaurant };
		} catch (error) {
			console.log(error);
			return { ok: false, error: 'Could not found restaurant' };
		}
	}

	async createRestaurant(
		owner: User,
		input: CreateRestaurantInput
	): Promise<CreateRestaurantOutput> {
		try {
			const entity = this.restaurantRepository.create(input);
			entity.owner = owner;

			const category = await this.categoryRepository.findOrSaveCategory(input.categoryName);
			entity.category = category;
			await this.restaurantRepository.save(entity);

			return { ok: true, restaurantId: entity.id };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not create restaurant.' };
		}
	}

	async editRestaurant(owner: User, input: EditRestaurantInput): Promise<EditRestaurantOutput> {
		try {
			const { restaurantId } = input;
			const restaurant = await this.restaurantRepository.findOne(restaurantId);
			if (!restaurant) {
				return { ok: false, error: 'Could not found restaurant.' };
			}
			if (owner.id !== restaurant.ownerId) {
				return { ok: false, error: 'You can\'t edit a restaurant that you don\'t own.' };
			}

			let category: Category = null;
			if (input.categoryName) {
				category = await this.categoryRepository.findOrSaveCategory(input.categoryName);
			}
			await this.restaurantRepository.save([{
				id: restaurantId,
				...input,
				...(category && { category })
			}]);

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not edit restaurant.' };
		}
	}

	async deleteRestaurant(owner: User, { restaurantId }: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
		try {
			const restaurant = await this.restaurantRepository.findOne(restaurantId);
			if (!restaurant) {
				return { ok: false, error: 'Could not found restaurant.' };
			}
			if (owner.id !== restaurant.ownerId) {
				return { ok: false, error: 'You can\'t delete a restaurant that you don\'t own.' };
			}

			await this.restaurantRepository.delete(restaurantId);

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not delete restaurant.' };
		}
	}

	async allCategories(): Promise<AllCategoriesOutput> {
		try {
			const categories = await this.categoryRepository.find();

			return { ok: true, categories };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not load categories.' };
		}
	}

	countRestaurants(category: Category): Promise<number> {
		return this.restaurantRepository.count({ category });
	}

	async findCategoryBySlug({ slug, page }: CategoryInput): Promise<CategoryOutput> {
		try {
			const category = await this.categoryRepository.findOne({ slug });
			if (!category) {
				return { ok: false, error: 'Could not found category.' };
			}

			const results = await this.restaurantRepository.find({
				where: { category },
				take: rowsInPage,
				skip: this.skip(page),
				order: {
					isPromoted: 'DESC'
				}
			});
			const totalResults = await this.countRestaurants(category);
			const totalPages = Math.ceil(totalResults / rowsInPage);

			return { ok: true, category, totalPages, results, totalResults };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not load category.' };
		}
	}

	async allRestaurants({ page }: AllRestaurantInput): Promise<AllRestaurantOutput> {
		try {
			const [results, totalResults] = await this.restaurantRepository.findAndCount({
				take: rowsInPage,
				skip: this.skip(page),
				order: {
					isPromoted: 'DESC'
				}
			});
			const totalPages = Math.ceil(totalResults / rowsInPage);

			return { ok: true, results, totalPages, totalResults };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not load restaurants.' };
		}
	}

	async findRestaurantById({ restaurantId }: RestaurantInput): Promise<RestaurantOutput> {
		try {
			const restaurant = await this.restaurantRepository.findOne(restaurantId, {
				relations: ['menu']
			});
			if (!restaurant) {
				return { ok: false, error: 'Could not found restaurant.' };
			}

			return { ok: true, restaurant };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not found restaurant.' };
		}
	}

	skip(page: number) {
		return (page - 1) * rowsInPage;
	}

	async searchRestaurantsByName({ query, page }: SearchRestaurantsInput): Promise<SearchRestaurantsOutput> {
		try {
			const [restaurants, totalResults] = await this.restaurantRepository.findAndCount({
				where: {
					name: Raw(name => `${name} ILIKE '%${query}%'`)
				},
				take: rowsInPage,
				skip: this.skip(page)
			});
			const totalPages = Math.ceil(totalResults / rowsInPage);

			return { ok: true, restaurants, totalResults, totalPages };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not found restaurants.' };
		}
	}

	async createDish(owner: User, input: CreateDishInput): Promise<CreateDishOutput> {
		try {
			const restaurant = await this.restaurantRepository.findOne(input.restaurantId);
			if (!restaurant) {
				return { ok: false, error: 'Could not found restaurant.' };
			}
			if (owner.id !== restaurant.ownerId) {
				return { ok: false, error: 'You cannot do that.' };
			}

			await this.dishRepository.save(this.dishRepository.create({ ...input, restaurant }));

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not create dish.' };
		}
	}

	async editDish(owner: User, input: EditDishInput): Promise<EditDishOutput> {
		try {
			const dish = await this.dishRepository.findOne(input.dishId, { relations: ['restaurant'] });
			if (!dish) {
				return { ok: false, error: 'Could not found dish.' };
			}
			if (dish.restaurant.ownerId !== owner.id) {
				return { ok: false, error: 'You can not do that.' };
			}

			await this.dishRepository.save({
				id: input.dishId,
				...input
			});

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not edit dish.' };
		}
	}

	async deleteDish(owner: User, { dishId }: DeleteDishInput): Promise<DeleteDishOutput> {
		try {
			const dish = await this.dishRepository.findOne(dishId, { relations: ['restaurant'] });
			if (!dish) {
				return { ok: false, error: 'Could not found dish.' };
			}
			if (dish.restaurant.ownerId !== owner.id) {
				return { ok: false, error: 'You can not do that.' };
			}

			await this.dishRepository.delete(dishId);

			return { ok: true };
		} catch (error) {
			console.error(error);
			return { ok: false, error: 'Could not delete dish.' };
		}
	}
}