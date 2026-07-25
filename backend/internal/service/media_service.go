package service

import (
	"fmt"
	"net/url"
)

type MediaService interface {
	GetProtectedPlaybackURL(rawURL, token string) string
	GenerateEmbedHTML(protectedURL string) string
}

type mediaService struct{}

func NewMediaService() MediaService {
	return &mediaService{}
}

func (s *mediaService) GetProtectedPlaybackURL(rawURL, token string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	q := parsed.Query()
	q.Set("token", token)
	q.Set("enablejsapi", "1")
	q.Set("origin", "https://themusica.in")
	parsed.RawQuery = q.Encode()
	return parsed.String()
}

func (s *mediaService) GenerateEmbedHTML(protectedURL string) string {
	return fmt.Sprintf(`<!DOCTYPE html><html><head><style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;}</style></head><body><iframe width="100%%" height="100%%" src="%s" frameborder="0" allowfullscreen></iframe></body></html>`, protectedURL)
}
