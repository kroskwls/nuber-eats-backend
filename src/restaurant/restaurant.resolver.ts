import { Args, Mutation, Resolver, Query, ResolveField, Int, Parent } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import { User } from 'src/user/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { AllRestaurantInput, AllRestaurantOutput } from './dtos/all-restaurants.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { RestaurantInput, RestaurantOutput } from './dtos/one-restaurant.dto';
import { SearchRestaurantsInput, SearchRestaurantsOutput } from './dtos/search-restaurants.dto';
import { Dish } from './entities/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';
import { MyRestaurantInput, MyRestaurantOutput } from './dtos/my-restaurant.dto';

@Resolver(of => Restaurant)
export class RestaurantResolver {
	constructor(private readonly restaurantService: RestaurantService) { }

	@Query(returns => MyRestaurantsOutput)
	@Role(['Owner'])
	myRestaurants(@AuthUser() owner: User): Promise<MyRestaurantsOutput> {
		return this.restaurantService.myRestaurants(owner);
	}

	@Query(returns => MyRestaurantOutput)
	@Role(['Owner'])
	myRestaurant(
		@AuthUser() owner: User,
		@Args('input') input: MyRestaurantInput
	): Promise<MyRestaurantOutput> {
		return this.restaurantService.myRestaurant(owner, input);
	}

	@Mutation(returns => CreateRestaurantOutput)
	@Role(['Owner'])
	createRestaurant(
		@AuthUser() owner: User,
		@Args('input') input: CreateRestaurantInput
	): Promise<CreateRestaurantOutput> {
		return this.restaurantService.createRestaurant(owner, input);
	}

	@Mutation(returns => EditRestaurantOutput)
	@Role(['Owner'])
	editRestaurant(
		@AuthUser() owner: User,
		@Args('input') input: EditRestaurantInput
	): Promise<EditRestaurantOutput> {
		return this.restaurantService.editRestaurant(owner, input);
	}

	@Mutation(returns => DeleteRestaurantOutput)
	@Role(['Owner'])
	deleteRestaurant(
		@AuthUser() owner: User,
		@Args('input') input: DeleteRestaurantInput
	): Promise<DeleteRestaurantOutput> {
		return this.restaurantService.deleteRestaurant(owner, input);
	}

	@Query(returns => AllRestaurantOutput)
	restaurants(@Args('input') input: AllRestaurantInput): Promise<AllRestaurantOutput> {
		return this.restaurantService.allRestaurants(input);
	}

	@Query(returns => RestaurantOutput)
	restaurant(@Args('input') input: RestaurantInput): Promise<RestaurantOutput> {
		return this.restaurantService.findRestaurantById(input);
	}

	@Query(returns => SearchRestaurantsOutput)
	searchRestaurants(@Args('input') input: SearchRestaurantsInput): Promise<SearchRestaurantsOutput> {
		return this.restaurantService.searchRestaurantsByName(input);
	}
}

@Resolver(of => Category)
export class CategoryResolver {
	constructor(private readonly restaurantService: RestaurantService) { }

	@ResolveField(type => Int)
	restaurantCount(@Parent() category: Category): Promise<number> {
		return this.restaurantService.countRestaurants(category);
	}

	@Query(type => AllCategoriesOutput)
	allCategories(): Promise<AllCategoriesOutput> {
		return this.restaurantService.allCategories();
	}

	@Query(type => CategoryOutput)
	categories(@Args('input') input: CategoryInput): Promise<CategoryOutput> {
		return this.restaurantService.findCategoryBySlug(input);
	}
}

@Resolver(of => Dish)
export class DishResolver {
	constructor(private readonly restaurantService: RestaurantService) { }

	@Mutation(type => CreateDishOutput)
	@Role(['Owner'])
	createDish(
		@AuthUser() owner: User,
		@Args('input') input: CreateDishInput
	): Promise<CreateDishOutput> {
		return this.restaurantService.createDish(owner, input);
	}
	
	@Mutation(type => EditDishOutput)
	@Role(['Owner'])
	editDish(
		@AuthUser() owner: User,
		@Args('input') input: EditDishInput
	): Promise<EditDishOutput> {
		return this.restaurantService.editDish(owner, input);
	}
	
	@Mutation(type => DeleteDishOutput)
	@Role(['Owner'])
	deleteDish(
		@AuthUser() owner: User,
		@Args('input') input: DeleteDishInput
	): Promise<DeleteDishOutput> {
		return this.restaurantService.deleteDish(owner, input);
	}
}