import { EntityRepository, Repository } from "typeorm";
import { Category } from "../entities/category.entity";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
	async findOrSaveCategory(name: string): Promise<Category> {
		const slug = name.trim().toLowerCase().replace(/ /g, '-');
		let category = await this.findOne({ slug });
		if (!category) {
			category = await this.save(
				this.create({ slug, name })
			);
		}

		return category;
	}
}