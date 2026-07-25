package email

import (
	"crypto/tls"

	"gopkg.in/gomail.v2"
)

type EmailSender interface {
	SendEmail(to, subject, body string) error
}

type emailSender struct {
	host string
	port int
	user string
	pass string
}

func NewEmailSender(host string, port int, user, pass string) EmailSender {
	return &emailSender{
		host: host,
		port: port,
		user: user,
		pass: pass,
	}
}

func (s *emailSender) SendEmail(to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.user)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(s.host, s.port, s.user, s.pass)
	// Some SMTP servers like Hostinger might require TLS config bypass for self signed certificates,
	// but generally standard TLS is fine. We will allow standard secure connection.
	d.TLSConfig = &tls.Config{InsecureSkipVerify: false, ServerName: s.host}

	return d.DialAndSend(m)
}
