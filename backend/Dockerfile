# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
ENV GOPROXY=https://proxy.golang.org,direct
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go

# Production stage
FROM alpine:3.21

RUN addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --from=builder /app/main .
COPY migrations ./migrations
RUN chown -R app:app /app

USER app

EXPOSE 8080

CMD ["./main"]