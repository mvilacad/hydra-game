#!/bin/bash

# Debug script to check server status
SERVER_IP="13.220.82.93"
SSH_KEY="~/.ssh/hydra-game-key"

echo "=== Debugging Hydra Game Server ==="
echo "Server IP: $SERVER_IP"
echo

echo "1. Testing HTTP connection..."
curl -I http://$SERVER_IP:5000 || echo "HTTP connection failed"
echo

echo "2. Testing if port 5000 is open..."
nc -z -v $SERVER_IP 5000 || echo "Port 5000 is not accessible"
echo

echo "3. SSH into server to check status..."
ssh -i $SSH_KEY ec2-user@$SERVER_IP << 'ENDSSH'
echo "=== Server Debug Info ==="

echo "1. Docker status:"
sudo systemctl status docker

echo -e "\n2. Hydra-game service status:"
sudo systemctl status hydra-game.service

echo -e "\n3. Docker containers:"
docker ps -a

echo -e "\n4. Docker logs (if container exists):"
docker logs hydra-game-app-1 2>/dev/null || echo "No hydra-game-app-1 container found"

echo -e "\n5. Project directory:"
ls -la /home/ec2-user/

echo -e "\n6. Hydra game directory (if exists):"
ls -la /home/ec2-user/hydra-game/ 2>/dev/null || echo "hydra-game directory not found"

echo -e "\n7. System logs for hydra-game service:"
sudo journalctl -u hydra-game.service --no-pager -l

echo -e "\n8. Docker compose file check:"
cat /home/ec2-user/hydra-game/docker-compose.prod.yml 2>/dev/null || echo "docker-compose.prod.yml not found"

echo -e "\n9. Network listening ports:"
sudo netstat -tlnp | grep :5000 || echo "No process listening on port 5000"

ENDSSH

echo "Debug complete!"