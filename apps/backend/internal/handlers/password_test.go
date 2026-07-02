package handlers

import "testing"

func TestHashPassword_VerifyCorrectPassword(t *testing.T) {
	hash, err := hashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("hashPassword failed: %v", err)
	}

	ok, err := verifyPassword(hash, "correct horse battery staple")
	if err != nil {
		t.Fatalf("verifyPassword failed: %v", err)
	}
	if !ok {
		t.Error("expected correct password to verify successfully")
	}
}

func TestVerifyPassword_WrongPassword(t *testing.T) {
	hash, err := hashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("hashPassword failed: %v", err)
	}

	ok, err := verifyPassword(hash, "wrong password")
	if err != nil {
		t.Fatalf("verifyPassword returned unexpected error: %v", err)
	}
	if ok {
		t.Error("expected wrong password to fail verification")
	}
}

func TestHashPassword_DifferentHashesForSamePassword(t *testing.T) {
	hash1, err := hashPassword("same-password")
	if err != nil {
		t.Fatalf("hashPassword failed: %v", err)
	}
	hash2, err := hashPassword("same-password")
	if err != nil {
		t.Fatalf("hashPassword failed: %v", err)
	}

	if hash1 == hash2 {
		t.Error("expected two hashes of the same password to differ due to random salt")
	}

	// Both must still verify correctly despite differing (different salts).
	ok1, _ := verifyPassword(hash1, "same-password")
	ok2, _ := verifyPassword(hash2, "same-password")
	if !ok1 || !ok2 {
		t.Error("expected both independently-salted hashes to verify the original password")
	}
}

func TestVerifyPassword_InvalidHashFormat(t *testing.T) {
	_, err := verifyPassword("not-a-real-hash", "whatever")
	if err == nil {
		t.Error("expected an error for a malformed hash string")
	}
}
