import { Router } from "express"; 
import * as authController from "../controllers/authController.js"

const router = Router();

router.get("/config", authController.getConfig);

router.get("/status", authController.checkStatus);

router.get("/login", authController.login);

router.get("/callback", authController.callback);

router.post("/refresh", authController.refreshToken);
export default router;
