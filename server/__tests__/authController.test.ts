import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { login, callback, refreshToken } from "../controllers/authController";
import type { Request, Response, NextFunction } from "express";
import { afterEach } from "node:test";
import { error } from "console";
import { ok } from "assert";
import { json } from "stream/consumers";

const MOCK_ENV = { ...process.env };

// Mock the data module to control the constants
vi.mock("../utils/data", () => ({
    SCOPES: ["user-read-email"],
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
        for (const key in process.env) {
            delete process.env[key];
        Object.assign(process.env, MOCK_ENV);
        }
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

    it("Redirect user to Spotify login page with proper parameters", () => {

        // Mock the config module to provide test values instead of real env 
        process.env.SPOTIFY_CLIENT_ID = "test-client-id", 
        process.env.SPOTIFY_REDIRECT_URI = "http://127.0.0.1:3001/api/auth/callback", 
        process.env.SCOPES = "user-read-email", 
        process.env.SPOTIFY_CLIENT_SECRET ="secret" // fake secret (not used in this test but safe to include)
    
        // Create a minimal fake Express request object
        const req = {} as Request;
        
        // Create a fake Express response object with mocked methods
        const res = {
            status: vi.fn().mockReturnThis(),   // allows chaining res.status().json()
            json: vi.fn(),                      // to capture JSON responses
            cookie: vi.fn().mockReturnThis(),   // to capture cookies set by login()
            redirect: vi.fn(),                  // to capture the redirect URL
        } as unknown as Response;

        // Call the login controller with our fake req/res
        login(req, res);

        // Ensure no error status was sent (no res.status(500), etc.)
        expect(res.status).not.toHaveBeenCalled();

        // Ensure exactly one redirect was triggered
        expect(res.redirect).toHaveBeenCalledTimes(1);

        // Get the first argument of the first redirect call (the URL)
        const redirectUrl = (res.redirect as any).mock.calls[0][0];

        // Check that the redirect URL starts with Spotify's authorize endpoint
        expect(redirectUrl.startsWith("https://accounts.spotify.com/authorize?")).toBe(true);

        // Extract the query string part (everything after the "?")
        const params = new URLSearchParams(redirectUrl.split("?")[1]);

        // Check individual query parameters
        expect(params.get("response_type")).toBe("code");
        expect(params.get("client_id")).toBe("test-client-id");
        expect(params.get("redirect_uri")).toBe("http://127.0.0.1:3001/api/auth/callback");
        expect(params.get("scope")).toBe("user-read-email");

        // State must be present and not empty (random string)
        expect(params.get("state")).toBeTruthy();

        // Ensure the controller set at least one cookie (spotify_auth_state)
        expect(res.cookie).toHaveBeenCalledTimes(1);
    }); 
});

describe("callback controller", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        // reset environment
        for (const key in process.env) delete process.env[key];
        Object.assign(process.env, MOCK_ENV);

        // set up default env vars
        process.env.SPOTIFY_CLIENT_ID = "test-client-id";
        process.env.SPOTIFY_CLIENT_SECRET = "test-client-secret";
        process.env.SPOTIFY_REDIRECT_URI = "http://localhost:8888/callback";

        // Access and clear the pendingStates Set from the controller
        // Note: You may need to export pendingStates for testing or use a different approach      
    });

    afterEach(() => {
        Object.assign(process.env, MOCK_ENV);
    });

    it("Verify state for CSRF protection", () => {
        const req = {
            query: {code: "abs", state: "data", error: "error"},
            cookie: {spotify_auth_state: "wrong data"}
        } as unknown as Request

        const res = {
            status: vi.fn().mockReturnThis(),   // allows chaining res.status().json()
            json: vi.fn(),                      // to capture JSON responses
            cookie: vi.fn().mockReturnThis(),   // to capture cookies set by login()
            redirect: vi.fn(),                  // to capture the redirect URL
            clearCookie: vi.fn()
        } as unknown as Response;

        callback(req, res);

        expect(res.clearCookie).toHaveBeenLastCalledWith("spotify_auth_state")
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalled()  
    });

    it("Should redirect If Spotify returned an error", async () => {
          const req = {
            query: {code: "abs", state: "data", error: "error"},
            cookies: {spotify_auth_state: "data"}
        } as unknown as Request;

        const res = {
            redirect: vi.fn(),
            clearCookie: vi.fn()
        };

        await callback(req, res);

        expect(res.redirect).toHaveBeenCalledOnce()
    });

    it("Should return an error if we don't have the authorization code", async () => {
        const req = {
            query: {code: "", state: "data"},
            cookies: {spotify_auth_state: "data"}
        } as unknown as Request;
        
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            clearCookie: vi.fn()
        };

        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Authorization code not provided"})
    });

    it("Should return error if token respons from spotify is failed", async ()=>{

        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            text: async () => "some error"
        });

        global.fetch = mockFetch as any;

          const req = {
            query: {code: "abs", state: "data"},
            cookies: {spotify_auth_state: "data"}
        } as unknown as Request;
        
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            clearCookie: vi.fn()
        };
        await callback(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({error: "Failed to exchange authorization code for token"})
    });

    it("auth=success", async () => {

    // Mock fetch so it returns a successful Spotify token response
    const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
            access_token: "abc",      // fake access token
            token_type: "type",
            expires_in: 1000,         // fake expiration time
            refresh_token: "dfg"      // fake refresh token
        })
    });

    // Replace real fetch with our mock
    global.fetch = mockFetch as any;

    // Fake request with code + state + correct cookie (CSRF passes)
    const req = {
        query: { code: "abs", state: "data" },
        cookies: { spotify_auth_state: "data" }
    } as unknown as Request;
    
    // Fake response object with all needed Express methods
    const res = {
        status: vi.fn().mockReturnThis(),  // allows res.status().json()
        cookie: vi.fn().mockReturnThis(),  // allows res.cookie().cookie()
        redirect: vi.fn(),                 // captures redirect URL
        json: vi.fn(),                     // captures JSON output
        clearCookie: vi.fn()               // captures clearCookie calls
    } as unknown as Response;

    // Call the controller function
    await callback(req, res);

    // Check that fetch was called one time
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Check that access_token cookie was set correctly
    expect(res.cookie).toHaveBeenCalledWith(
        "spotify_access_token",
        "abc",
        expect.objectContaining({
            httpOnly: true,
            sameSite: "lax"
        })
    );

    // Check that refresh_token cookie was set correctly
    expect(res.cookie).toHaveBeenCalledWith(
        "spotify_refresh_token",
        "dfg",
        expect.objectContaining({
            httpOnly: true,
            sameSite: "lax"
        })
    );

    // Check that redirect to frontend with ?auth=success happened
    expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("?auth=success")
    )
});

describe("refreshToken controller", () => {
     beforeEach(() => {
        vi.resetAllMocks();

        // reset environment
        for (const key in process.env) delete process.env[key];
        Object.assign(process.env, MOCK_ENV);

        // set up default env vars
        process.env.SPOTIFY_CLIENT_ID = "test-client-id";
        process.env.SPOTIFY_CLIENT_SECRET = "test-client-secret";
        process.env.SPOTIFY_REDIRECT_URI = "http://localhost:8888/callback";

        // Access and clear the pendingStates Set from the controller
        // Note: You may need to export pendingStates for testing or use a different approach      
    });

    afterEach(() => {
        Object.assign(process.env, MOCK_ENV);
    });

     it("Should return error If no refresh token" , async () => {

    const req = {
        cookies: {
            spotify_refresh_token: ""
        }
    } as unknown as Request

    const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            clearCookie: vi.fn()
    } as unknown as Response

    await refreshToken(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "Refresh token is required"})
     });

     it("Should return error if refresh token is failed", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            text: async () => "some error"
        });

        global.fetch = mockFetch as any;

        const req = {
            cookies: {
                spotify_refresh_token: "some token"
            }
        }
        
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            clearCookie: vi.fn()
        };

        await refreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({error: "Failed to refresh token"})
     });
    })

     it("Success to update cookies with new access token", async () => {

    // Mock fetch so it returns a successful response from Spotify
    const mockGetData = vi.fn().mockResolvedValue({
        ok: true,                // Spotify says request was successful
        json: async () => ({     // This is the JSON we get from Spotify
            access_token: "new token",   // new access token
            refresh_token: "dfg",        // new refresh token
        })
    });

    // Replace real global fetch with our mock version
    global.fetch = mockGetData as any;

    // Fake request object
    // It contains the refresh token saved in cookies
    const req = {
        cookies: { spotify_refresh_token: "dfg" }
    } as unknown as Request;
    
    // Fake response object
    // We mock all methods we expect the controller to use
    const res = {
        status: vi.fn().mockReturnThis(),   // allows res.status().json()
        cookie: vi.fn().mockReturnThis(),   // allows res.cookie().cookie()
        json: vi.fn(),                      // captures JSON response
        clearCookie: vi.fn()                // if controller clears cookies
    } as unknown as Response;

    // Call the controller function we want to test
    await refreshToken(req, res);

    // Check that fetch was called exactly 1 time
    expect(mockGetData).toHaveBeenCalledTimes(1);

    // Check that access_token cookie was updated correctly
    expect(res.cookie).toHaveBeenCalledWith(
        "spotify_access_token",
        "new token",
        expect.objectContaining({
            httpOnly: true,   // cookie is protected
            sameSite: "lax"   // sameSite setting
        })
    );
    // Check that controller returned a success message
    expect(res.json).toHaveBeenCalledWith({ success: true });
})
})