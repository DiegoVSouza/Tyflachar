package middleware

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-do-not-use-in-prod"

// signToken builds a JWT with the given claims, signed with testSecret (or a
// different secret when wrongSecret is non-empty, to simulate a forged/invalid token).
func signToken(t *testing.T, claims jwt.MapClaims, wrongSecret string) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := testSecret
	if wrongSecret != "" {
		secret = wrongSecret
	}
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign test token: %v", err)
	}
	return signed
}

func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"user_id":   float64(1),
		"branch_id": float64(2),
		"role":      "admin",
		"exp":       time.Now().Add(1 * time.Hour).Unix(),
	}
}

// echoLocalsApp returns a fiber app protected by the given middleware chain;
// the final handler echoes back the populated c.Locals so tests can assert on them.
func echoLocalsApp(handlers ...fiber.Handler) *fiber.App {
	app := fiber.New()
	chain := append(append([]fiber.Handler{}, handlers...), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"branch_id": c.Locals("branch_id"),
			"user_id":   c.Locals("user_id"),
			"role":      c.Locals("role"),
		})
	})
	app.Get("/protected", chain...)
	return app
}

func doRequest(t *testing.T, app *fiber.App, target string, headers map[string]string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test failed: %v", err)
	}
	return resp
}

func TestJWTAuth_ValidToken_PopulatesLocals(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret))
	tokenStr := signToken(t, validClaims(), "")

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body map[string]interface{}
	decodeJSON(t, resp.Body, &body)
	if body["branch_id"] != float64(2) {
		t.Errorf("expected branch_id=2, got %v", body["branch_id"])
	}
	if body["user_id"] != float64(1) {
		t.Errorf("expected user_id=1, got %v", body["user_id"])
	}
	if body["role"] != "admin" {
		t.Errorf("expected role=admin, got %v", body["role"])
	}
}

func TestJWTAuth_MissingHeader(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret))
	resp := doRequest(t, app, "/protected", nil)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTAuth_MalformedHeader(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret))
	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "NotBearer sometoken",
	})
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTAuth_InvalidSignature(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret))
	tokenStr := signToken(t, validClaims(), "a-different-secret")

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTAuth_ExpiredToken(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret))
	claims := validClaims()
	claims["exp"] = time.Now().Add(-1 * time.Hour).Unix()
	tokenStr := signToken(t, claims, "")

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTAuthWS_ValidToken_PopulatesLocals(t *testing.T) {
	app := echoLocalsApp(JWTAuthWS(testSecret))
	tokenStr := signToken(t, validClaims(), "")

	resp := doRequest(t, app, "/protected?token="+tokenStr, nil)
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body map[string]interface{}
	decodeJSON(t, resp.Body, &body)
	if body["branch_id"] != float64(2) {
		t.Errorf("expected branch_id=2, got %v", body["branch_id"])
	}
	if body["role"] != "admin" {
		t.Errorf("expected role=admin, got %v", body["role"])
	}
}

func TestJWTAuthWS_MissingToken(t *testing.T) {
	app := echoLocalsApp(JWTAuthWS(testSecret))
	resp := doRequest(t, app, "/protected", nil)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

func TestJWTAuthWS_InvalidToken(t *testing.T) {
	app := echoLocalsApp(JWTAuthWS(testSecret))
	resp := doRequest(t, app, "/protected?token=garbage.not.a.jwt", nil)
	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", resp.StatusCode)
	}
}

// ─── RequireRole ────────────────────────────────────────────────────────────

func TestRequireRole_AllowsMatchingRole(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret), RequireRole("admin"))
	tokenStr := signToken(t, validClaims(), "") // role=admin

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRequireRole_AllowsAnyOfMultipleRoles(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret), RequireRole("owner", "admin"))
	tokenStr := signToken(t, validClaims(), "") // role=admin

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestRequireRole_RejectsNonMatchingRole(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret), RequireRole("admin"))
	claims := validClaims()
	claims["role"] = "atendente"
	tokenStr := signToken(t, claims, "")

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}

	var body map[string]string
	decodeJSON(t, resp.Body, &body)
	want := "forbidden: requires role admin"
	if body["error"] != want {
		t.Errorf("expected error %q, got %q", want, body["error"])
	}
}

func TestRequireRole_RejectsMissingRole(t *testing.T) {
	app := echoLocalsApp(JWTAuth(testSecret), RequireRole("admin"))
	claims := jwt.MapClaims{
		"user_id":   float64(1),
		"branch_id": float64(2),
		"exp":       time.Now().Add(1 * time.Hour).Unix(),
		// no "role" claim at all
	}
	tokenStr := signToken(t, claims, "")

	resp := doRequest(t, app, "/protected", map[string]string{
		"Authorization": "Bearer " + tokenStr,
	})
	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func decodeJSON(t *testing.T, body io.ReadCloser, v interface{}) {
	t.Helper()
	defer body.Close()
	if err := json.NewDecoder(body).Decode(v); err != nil {
		t.Fatalf("failed to decode JSON body: %v", err)
	}
}
