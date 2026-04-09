import * as menuService from "./menu.service.js";
import { asyncHandler } from "../../common/asyncHandler.js";

export const getAllMenuItems = asyncHandler(async (req, res) => {
    const result = await menuService.getAllMenuItems();
    res.status(200).json(result);
});

export const getPublicCatalogCategories = asyncHandler(async (req, res) => {
    const result = await menuService.getPublicMenuCatalogCategories();
    res.status(200).json(result);
});

export const getPublicCatalogItems = asyncHandler(async (req, res) => {
    const result = await menuService.getPublicMenuCatalog({
        category: req.query.category,
        search: req.query.search,
        sort: req.query.sort,
    });
    res.status(200).json(result);
});

export const createMenuItem = asyncHandler(async (req, res) => {
    const result = await menuService.createMenuItem(req.body);
    res.status(201).json(result);
});

export const importMenuItem = asyncHandler(async (req, res) => {
    const result = await menuService.importMenuItemFromCatalog(req.body);
    res.status(201).json(result);
});

export const updateMenuItem = asyncHandler(async (req, res) => {
    const result = await menuService.updateMenuItem(req.params.id, req.body);
    res.status(200).json(result);
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
    const result = await menuService.deleteMenuItem(req.params.id);
    res.status(200).json(result);
});