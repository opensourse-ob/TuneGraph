import { Router } from "express";
import { todo } from "node:test";
import * as spotifycontroller from "../controllers/spotifyController";
import { requireAuth } from "../middlewares/requireAuth"
import { spotifyApiRequest } from "../utils/spotifyApiRequest";

const router = Router();

router.get("/top-artists", requireAuth, spotifycontroller.getTopArtists);

router.get("/top-songs", requireAuth, spotifycontroller.getTopSongs);

router.get("/top-genres", requireAuth, spotifycontroller.getTopGenres);

router.get("/users/:id", requireAuth, spotifycontroller.getUserProfile)

export default router;
