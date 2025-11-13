import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { login, callback, refreshToken } from "../controllers/authController";
import type { Request, Response, NextFunction } from "express";

const MOCK_ENV = { ...process.env };

// Mock the data module to control the constants
vi.mock("../utils/data", () => ({
    SCOPES: [],
    FRONTEND_URL: "http://localhost:3000",
    get SPOTIFY_CLIENT_ID() {
        return process.env.SPOTIFY_CLIENT_ID;
    },
    get SPOTIFY_REDIRECT_URI() {
        return process.env.SPOTIFY_REDIRECT_URI;
    },
    get SPOTIFY_CLIENT_SECRET() {
        return process.env.SPOTIFY_CLIENT_SECRET;
    },
}));

describe('login controller', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // Reset process.env values without replacing the object
        for (const key in process.env) delete process.env[key];
        Object.assign(process.env, MOCK_ENV);
    });

    afterAll(() => {
        Object.assign(process.env, MOCK_ENV);
    });

    it('should return 500 if SPOTIFY_CLIENT_ID is not configured', () => {
        // Arrange
        delete process.env.SPOTIFY_CLIENT_ID; // Simulates missing env var
        process.env.SPOTIFY_REDIRECT_URI = "http://localhost/callback";

        const req = {} as Request;
        const res = {
            status: vi.fn().mockReturnThis(), // lets us chain res.status().json() like in Express
            json: vi.fn()
        } as unknown as Response;

        // Act
        login(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500); // confirms correct HTTP code
        expect(res.json).toHaveBeenCalledWith({ // checks correct error body
            error: 'Spotify Client ID not configured'
        });
    });

    it("should return 500 if SPOTIFY_REDIRECT_URI is not configured", () => {
        process.env.SPOTIFY_CLIENT_ID = "dummy-id";
        delete process.env.SPOTIFY_REDIRECT_URI;

        const req = {} as Request;
        const res = { 
            status: vi.fn().mockReturnThis(),
            json: vi.fn() 
        } as unknown as Response;

        login(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Redirect URI not configured"
        });
    });
});