#!/bin/bash
set -e

DOMAIN="themusica.in"
EMAIL="admin@themusica.in"
DATA_PATH="/etc/letsencrypt"
WEBROOT_PATH="./certbot/www"

echo "### Starting SSL setup for $DOMAIN"

# 1. Stop Nginx to free up port 80
echo "### Stopping Nginx..."
docker compose stop nginx

# 2. Install certbot if it's not installed
if ! command -v certbot &> /dev/null; then
    echo "### Installing certbot..."
    sudo apt update
    sudo apt install certbot -y
fi

# 3. Generate the SSL certificate using standalone mode
echo "### Requesting Let's Encrypt certificate for $DOMAIN..."
sudo certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    -m $EMAIL

# 4. Restart Nginx now that certificates exist
echo "### Starting Nginx..."
docker compose up -d nginx

echo "### SSL Setup Complete!"
echo "### Nginx should now be running with HTTPS."
