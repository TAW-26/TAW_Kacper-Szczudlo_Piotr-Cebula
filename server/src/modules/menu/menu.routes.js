import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { protect, authorize } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", menuController.getAllMenuItems);
router.get("/catalog/categories", menuController.getPublicCatalogCategories);
router.get("/catalog", menuController.getPublicCatalogItems);
router.post("/catalog/import", protect, authorize(["admin"]), menuController.importMenuItem);
router.post("/", protect, authorize(["admin"]), menuController.createMenuItem);
router.put("/:id", protect, authorize(["admin"]), menuController.updateMenuItem);
router.delete("/:id", protect, authorize(["admin"]), menuController.deleteMenuItem);

export default router;