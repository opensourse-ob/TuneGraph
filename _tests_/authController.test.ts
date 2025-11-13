import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
 
describe("login", () => {
  beforeEach(() => {
    vi.resetAllMocks(); //clean up every mock fn after running
    vi.resetModules(); //clean up cashe of import modules
  });

  it("should return 500 if SPOTIFY_CLIENT_ID is not configured", async () => {
    // change real data for fake data
    vi.doMock("../server/utils/data", () => ({
      SPOTIFY_CLIENT_ID: undefined, 
     SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3001/api/auth/callback",
    }));

    const { login } = await import("../server/controllers/authController");

    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Spotify Client ID not configured",
    });
  });

  it("should return 500 if Redirect URI not configured", async () => {

    vi.doMock("../server/utils/data", () => ({
      SPOTIFY_CLIENT_ID: "d70e60968d4c4cdfa810404f8f6f128b", // есть client id
      SPOTIFY_REDIRECT_URI: undefined, 
    }));

    const { login } = await import("../server/controllers/authController");

    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Redirect URI not configured",
    });
  });

 it("Redirect user to Spotify login page with proper parameters", async () => {
  // Mock the config module to provide test values instead of real env 
  vi.doMock("../server/utils/data", () => ({
    SPOTIFY_CLIENT_ID: "test-client-id", 
    SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3001/api/auth/callback", 
    SCOPES: ["user-read-email"], 
    SPOTIFY_CLIENT_SECRET: "secret", // fake secret (not used in this test but safe to include)
  }));

  // Import the controller AFTER mocking, so it uses the mocked values
  const { login } = await import("../server/controllers/authController");

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

  })

  describe("callback", () => {
     beforeEach(() => {
    vi.resetAllMocks(); //clean up every mock fn after running
    vi.resetModules(); //clean up cashe of import modules
  });

  it("")
  })

