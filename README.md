# Nuber Eats

The Backend of Nuber Eats Clone

npm i @nestjs/graphql graphql@^15 apollo-server-express apollo-server-core

npm i class-transformer class-validator

npm i @nestjs/typeorm typeorm pg

npm i @nestjs/config cross-env

npm i bcrypt @types/bcrypt joi

npm i jsonwebtoken @types/jsonwebtoken

npm i uuid

npm i got form-data

## User Entity:

- id
- createdAt
- updatedAt

- email
- password
- role(client | owner | delivery)

## User CRUD:

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

# Restaurant Model

- name
- category
- address
- coverImage

# Restaurant Resolver

- Edit Restaurant
- Delete Restaurant

- See Categoryies
- See Restaurants by Category (pagination)
- See Restaurants (pagination)
- See One Restaurant
- Search Restaurant

- Create Dish
- Edit Dish
- Delete Dish

- Create Orders
- Get Orders
- Get One Order
- Edit Orders
- Orders Subscription:
  - Peding Orders for Owner 
	(sub: newOrder) 
	(trigger: createOrder(newOrder))
  - Order Status for Customer, Delivery, Owner 
	(sub: orderUpdate) 
	(trigger: editOrder(orderUpdate))
  - Pending Pickup Order for Delivery 
	(sub: orderUpdate) 
	(trigger: editOrder(orderUpdate))

- Payments (cron job)