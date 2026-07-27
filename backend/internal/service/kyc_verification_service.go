package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

type KYCFile struct {
	Field       string
	Filename    string
	ContentType string
	Data        []byte
}

type KYCVerificationResult struct {
	AadhaarNumber string `json:"aadhaar_number"`
	AadhaarName   string `json:"aadhaar_name"`
	PANNumber     string `json:"pan_number"`
	PANName       string `json:"pan_name"`
	LivenessPass  bool   `json:"liveness_pass"`
}

type KYCVerificationService interface {
	Verify(ctx context.Context, files []KYCFile) (*KYCVerificationResult, error)
}

type kycVerificationService struct {
	url   string
	token string
	client *http.Client
}

func NewKYCVerificationService(url, token string) KYCVerificationService {
	return &kycVerificationService{url: strings.TrimRight(url, "/"), token: token, client: &http.Client{Timeout: 45 * time.Second}}
}

func (s *kycVerificationService) Verify(ctx context.Context, files []KYCFile) (*KYCVerificationResult, error) {
	if s.url == "" {
		return nil, errors.New("automated KYC verification is not configured")
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for _, file := range files {
		part, err := writer.CreateFormFile(file.Field, file.Filename)
		if err != nil { return nil, err }
		if _, err = part.Write(file.Data); err != nil { return nil, err }
	}
	if err := writer.Close(); err != nil { return nil, err }

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.url, &body)
	if err != nil { return nil, err }
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if s.token != "" { req.Header.Set("Authorization", "Bearer "+s.token) }
	resp, err := s.client.Do(req)
	if err != nil { return nil, fmt.Errorf("KYC verification service unavailable: %w", err) }
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("KYC verification service returned status %d", resp.StatusCode)
	}
	var result KYCVerificationResult
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&result); err != nil { return nil, err }
	return &result, nil
}

func normalizeKYCName(name string) string {
	return strings.Join(strings.Fields(strings.Map(func(r rune) rune {
		if r >= 'A' && r <= 'Z' || r >= 'a' && r <= 'z' || r == ' ' { return r }
		return -1
	}, strings.ToUpper(name))), " ")
}

func ValidateKYCResult(result *KYCVerificationResult) error {
	if result == nil || !result.LivenessPass { return errors.New("live selfie verification failed") }
	if len(result.AadhaarNumber) != 12 || strings.Trim(result.AadhaarNumber, "0123456789") != "" { return errors.New("valid Aadhaar number could not be read") }
	if len(result.PANNumber) != 10 { return errors.New("valid PAN number could not be read") }
	pan := strings.ToUpper(result.PANNumber)
	if !((pan[0] >= 'A' && pan[0] <= 'Z') && (pan[1] >= 'A' && pan[1] <= 'Z') && (pan[2] >= 'A' && pan[2] <= 'Z') && (pan[3] >= 'A' && pan[3] <= 'Z') && (pan[4] >= 'A' && pan[4] <= 'Z') && (pan[5] >= '0' && pan[5] <= '9') && (pan[6] >= '0' && pan[6] <= '9') && (pan[7] >= '0' && pan[7] <= '9') && (pan[8] >= '0' && pan[8] <= '9') && (pan[9] >= 'A' && pan[9] <= 'Z')) { return errors.New("valid PAN number could not be read") }
	if normalizeKYCName(result.AadhaarName) == "" || normalizeKYCName(result.AadhaarName) != normalizeKYCName(result.PANName) { return errors.New("Aadhaar and PAN names do not match") }
	return nil
}
