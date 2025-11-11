import { Router } from "express";
import { todo } from "node:test";
import * as spotifycontroller from "../controllers/spotifyController";
import { requireAuth } from "../middlewares/requireAuth"

const router = Router();

router.get("/top-artists", requireAuth, spotifycontroller.getTopArtists);

router.get("/top-songs", requireAuth, spotifycontroller.getTopSongs);

router.get("/top-genres", requireAuth, spotifycontroller.getTopGenres);

export default router;
