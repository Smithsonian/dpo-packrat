# Updates the global nginx.conf on the server
sudo cp -v ./scripts/proxy/nginx.conf /etc/nginx/nginx.conf

# Restart nginx service
sudo service nginx restart

# Check if status is active
sudo service nginx status

# Use the command below to stop if you're getting nginx: [emerg] bind() to 0.0.0.0:80 failed
# sudo fuser -k 80/tcp