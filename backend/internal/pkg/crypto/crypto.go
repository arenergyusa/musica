package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
)

var encryptionKey []byte

// Init initializes the crypto package with the given key
func Init(key string) error {
	if len(key) != 32 {
		return errors.New("encryption key must be exactly 32 bytes")
	}
	encryptionKey = []byte(key)
	return nil
}

// Encrypt encrypts a string using AES-256-GCM
func Encrypt(text string) (string, error) {
	if text == "" {
		return "", nil
	}
	if strings.HasPrefix(text, "enc:v1:") {
		return text, nil
	}
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(text), nil)
	return "enc:v1:" + base64.URLEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts an AES-256-GCM encrypted string
func Decrypt(cryptoText string) (string, error) {
	if cryptoText == "" {
		return "", nil
	}
	if !strings.HasPrefix(cryptoText, "enc:v1:") {
		// Legacy unencrypted plaintext fallback
		return cryptoText, nil
	}

	raw := strings.TrimPrefix(cryptoText, "enc:v1:")
	data, err := base64.URLEncoding.DecodeString(raw)
	if err != nil {
		return "", fmt.Errorf("malformed base64 encrypted data: %w", err)
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("malformed ciphertext: payload smaller than nonce size")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		log.Printf("CRYPTO ERROR: gcm.Open authentication failed: %v", err)
		return "", fmt.Errorf("decryption failed: authentication error: %w", err)
	}

	return string(plaintext), nil
}

// Hash computes an HMAC-SHA256 hex string of normalized text for indexed unique lookups
func Hash(text string) (string, error) {
	if len(encryptionKey) == 0 {
		return "", errors.New("crypto uninitialized: encryptionKey is empty")
	}
	if text == "" {
		return "", nil
	}
	normalized := strings.ToUpper(strings.TrimSpace(text))
	h := hmac.New(sha256.New, encryptionKey)
	h.Write([]byte(normalized))
	return hex.EncodeToString(h.Sum(nil)), nil
}
