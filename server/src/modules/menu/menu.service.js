import MenuItem from "./menu.model.js";
import { AppError } from "../../common/appError.js";
import {
	getThemealdbCatalog,
	getThemealdbCatalogItemById,
	getThemealdbCategories,
} from "./themealdb.service.js";

const assertNonEmptyString = (value, message) => {
	if (typeof value !== "string" || !value.trim()) {
		throw new AppError(message, 400);
	}

	return value.trim();
};

const assertValidPrice = (value) => {
	const parsedPrice = Number(value);
	if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
		throw new AppError("Cena musi być dodatnią liczbą", 400);
	}

	return Number(parsedPrice.toFixed(2));
};

const mapImportedMealToMenuPayload = (meal, price, isAvailable) => ({
	name: meal.name,
	description: "",
	price,
	category: meal.category || "Other",
	isAvailable,
	imageUrl: meal.imageUrl || "",
	externalSource: "themealdb",
	externalId: meal.externalId,
});

export const getAllMenuItems = async () => {
	const items = await MenuItem.find({}, { description: 0 }).sort({ name: 1 });
	return { items };
};

export const getPublicMenuCatalog = async ({ category, search, sort }) => {
	const items = await getThemealdbCatalog({ category, search, sort });
	return { items };
};

export const getPublicMenuCatalogCategories = async () => {
	const categories = await getThemealdbCategories();
	return { categories };
};

export const createMenuItem = async ({ name, price, description, category, isAvailable, imageUrl }) => {
	const normalizedName = assertNonEmptyString(name, "Nazwa jest wymagana");
	const normalizedCategory = assertNonEmptyString(category, "Kategoria jest wymagana");
	const normalizedPrice = assertValidPrice(price);

	const newMenuItem = new MenuItem({
		name: normalizedName,
		price: normalizedPrice,
		description: typeof description === "string" ? description.trim() : "",
		category: normalizedCategory,
		isAvailable: isAvailable !== undefined ? isAvailable : true
		,
		imageUrl: typeof imageUrl === "string" ? imageUrl.trim() : "",
	});

	const savedItem = await newMenuItem.save();
	return { message: "Pozycja menu została utworzona", data: savedItem };
};

export const importMenuItemFromCatalog = async ({ mealId, price, isAvailable }) => {
	const normalizedMealId = assertNonEmptyString(mealId, "ID pozycji z katalogu jest wymagane");
	const normalizedPrice = assertValidPrice(price);
	const normalizedAvailability = typeof isAvailable === "boolean" ? isAvailable : true;

	const meal = await getThemealdbCatalogItemById(normalizedMealId);
	const payload = mapImportedMealToMenuPayload(meal, normalizedPrice, normalizedAvailability);

	const existingItem = await MenuItem.findOne({
		externalSource: "themealdb",
		externalId: normalizedMealId,
	});

	if (existingItem) {
		existingItem.set(payload);
		const savedExistingItem = await existingItem.save();
		return { message: "Pozycja menu została zaktualizowana z katalogu", data: savedExistingItem };
	}

	const createdItem = await MenuItem.create(payload);
	return { message: "Pozycja menu została zaimportowana", data: createdItem };
};

export const updateMenuItem = async (id, payload) => {
	const nextPayload = {};

	if (payload.price !== undefined) {
		nextPayload.price = assertValidPrice(payload.price);
	}

	if (payload.isAvailable !== undefined) {
		nextPayload.isAvailable = Boolean(payload.isAvailable);
	}

	const updatedItem = await MenuItem.findByIdAndUpdate(id, nextPayload, { new: true });
	if (!updatedItem) {
		throw new AppError("Pozycja menu nie znaleziona", 404);
	}

	return { message: "Pozycja menu została zaktualizowana", data: updatedItem };
};

export const deleteMenuItem = async (id) => {
	const deletedItem = await MenuItem.findByIdAndDelete(id);
	if (!deletedItem) {
		throw new AppError("Pozycja menu nie znaleziona", 404);
	}

	return { message: "Pozycja menu została usunięta", data: deletedItem };
};
