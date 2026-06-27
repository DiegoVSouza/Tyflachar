// genhash: generates an Argon2id hash for use in seed migrations.
// Usage: go run scripts/genhash/main.go <password>
package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"

	"golang.org/x/crypto/argon2"
)

func main() {
	password := "admin123"
	if len(os.Args) > 1 {
		password = os.Args[1]
	}

	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		fmt.Fprintf(os.Stderr, "error generating salt: %v\n", err)
		os.Exit(1)
	}

	const (
		memory      = 64 * 1024 // 64 MB
		iterations  = 3
		parallelism = 4
		keyLength   = 32
	)

	hash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, keyLength)

	encoded := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		memory, iterations, parallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	)

	fmt.Printf("Password : %s\n", password)
	fmt.Printf("Hash     : %s\n", encoded)
}
