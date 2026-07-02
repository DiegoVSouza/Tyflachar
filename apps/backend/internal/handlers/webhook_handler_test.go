package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"testing"

	"crm-whatsapp-api/internal/config"
)

func computeSignature(secret string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func TestValidSignature_ValidHMAC(t *testing.T) {
	secret := "my-app-secret"
	body := []byte(`{"entry":[{"changes":[]}]}`)

	h := &WebhookHandler{cfg: &config.Config{MetaAppSecret: secret}}

	if !h.validSignature(body, computeSignature(secret, body)) {
		t.Error("expected valid signature to be accepted")
	}
}

func TestValidSignature_InvalidHMAC(t *testing.T) {
	secret := "my-app-secret"
	body := []byte(`{"entry":[{"changes":[]}]}`)

	h := &WebhookHandler{cfg: &config.Config{MetaAppSecret: secret}}

	// Signed with the wrong secret.
	forged := computeSignature("a-different-secret", body)
	if h.validSignature(body, forged) {
		t.Error("expected forged signature to be rejected")
	}
}

func TestValidSignature_TamperedBody(t *testing.T) {
	secret := "my-app-secret"
	body := []byte(`{"entry":[{"changes":[]}]}`)

	h := &WebhookHandler{cfg: &config.Config{MetaAppSecret: secret}}

	sig := computeSignature(secret, body)
	tamperedBody := []byte(`{"entry":[{"changes":[{"evil":true}]}]}`)
	if h.validSignature(tamperedBody, sig) {
		t.Error("expected signature computed over a different body to be rejected")
	}
}

func TestValidSignature_EmptySecretIsPermissive(t *testing.T) {
	// With no META_APP_SECRET configured, validation is skipped entirely — any
	// signature is accepted. config.Load() fails boot in production if this is
	// empty (see internal/config/config.go), so this permissive path only applies
	// outside production.
	h := &WebhookHandler{cfg: &config.Config{MetaAppSecret: ""}}

	if !h.validSignature([]byte("anything"), "not-even-a-real-signature") {
		t.Error("expected empty META_APP_SECRET to permissively accept any signature")
	}
}
