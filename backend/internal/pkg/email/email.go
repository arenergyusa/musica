package email

import (
	"crypto/tls"
	"fmt"
	"strings"

	"gopkg.in/gomail.v2"
)

const (
	// AppName is the display name shown as the email sender.
	AppName = "Musica"
	// FromEmail is the sender email address.
	FromEmail = "hello@themusica.in"
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
	m.SetHeader("From", fmt.Sprintf("%s <%s>", AppName, FromEmail))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(s.host, s.port, s.user, s.pass)
	// Some SMTP servers like Hostinger might require TLS config bypass for self signed certificates,
	// but generally standard TLS is fine. We will allow standard secure connection.
	d.TLSConfig = &tls.Config{InsecureSkipVerify: false, ServerName: s.host}

	return d.DialAndSend(m)
}

// RenderUsernameEmail announces the user's system-generated login username.
func RenderUsernameEmail(name, username string) string {
	greeting := "Hi"
	if name != "" {
		greeting = "Hi " + strings.TrimSpace(strings.Fields(name)[0]) + ","
	}
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#EEF2FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:#1D4ED8;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
      <div style="display:inline-block;background:#FFFFFF;color:#1D4ED8;font-weight:800;font-size:20px;padding:8px 20px;border-radius:10px;">%s</div>
    </div>
    <div style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:32px;border:1px solid #E2E8F0;border-top:0;">
      <h2 style="margin:0 0 10px;color:#0F172A;font-size:18px;line-height:1.4;">Your account is ready!</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">%s</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:14px 0 0;">Your Musica login username is:</p>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:18px;text-align:center;margin:16px 0 6px;">
        <span style="font-size:26px;letter-spacing:4px;font-weight:700;color:#1D4ED8;">%s</span>
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:14px 0 0;">
        You can sign in with this username (or your email) together with your password.
      </p>
      <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:14px;">Keep this username safe — do not share it with anyone.</p>
    </div>
    <p style="text-align:center;color:#94A3B8;font-size:11px;margin-top:18px;line-height:1.6;">
      Musica<br>
      <a href="https://the-musica.com" style="color:#6366F1;text-decoration:none;">https://the-musica.com</a>
    </p>
  </div>
</body>
</html>`, AppName, greeting, username)
}

// RenderOTPEmail builds a fully styled, branded Musica email with the given title, message and OTP.
func RenderOTPEmail(title, message, otpCode string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#EEF2FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:#1D4ED8;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
      <div style="display:inline-block;background:#FFFFFF;color:#1D4ED8;font-weight:800;font-size:20px;padding:8px 20px;border-radius:10px;">%s</div>
    </div>
    <div style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:32px;border:1px solid #E2E8F0;border-top:0;">
      <h2 style="margin:0 0 10px;color:#0F172A;font-size:18px;line-height:1.4;">%s</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">%s</p>
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:18px;text-align:center;margin:22px 0 6px;">
        <span style="font-size:30px;letter-spacing:8px;font-weight:700;color:#1D4ED8;">%s</span>
      </div>
      <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
    <p style="text-align:center;color:#94A3B8;font-size:11px;margin-top:18px;line-height:1.6;">
      Musica<br>
      <a href="https://the-musica.com" style="color:#6366F1;text-decoration:none;">https://the-musica.com</a>
    </p>
  </div>
</body>
</html>`, AppName, title, message, otpCode)
}
