import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import type { InstanceArgs } from "@pulumi/aws/ec2";

// Configure AWS provider to use local AWS CLI credentials
const provider = new aws.Provider("aws-provider", {
	region: aws.config.region || "us-east-1", // Uses AWS CLI default region
	// Pulumi will automatically use AWS CLI credentials from ~/.aws/credentials
});

// Read configuration values from Pulumi.dev.yaml
const config = new pulumi.Config();
const instanceType = config.get("instanceType") || "t2.micro";

// GitHub repository name for container registry
const repoName = config.get("repoName") || "mvilacad/hydra-game";

// Use existing key pair name if provided, otherwise deploy without SSH access
const keyPairName = config.get("keyPairName"); // Optional - only set if you have a key pair

// Create a security group to allow HTTP access (and SSH if key pair is configured)
const securityGroupIngress = [
	{
		protocol: "tcp",
		fromPort: 5000,
		toPort: 5000,
		cidrBlocks: ["0.0.0.0/0"],
	},
];

// Add SSH access only if key pair is configured
if (keyPairName) {
	securityGroupIngress.push({
		protocol: "tcp",
		fromPort: 22,
		toPort: 22,
		cidrBlocks: ["0.0.0.0/0"],
	});
}

const securityGroup = new aws.ec2.SecurityGroup(
	"hydra-game-sg",
	{
		description: keyPairName
			? "Allow HTTP and SSH access to Hydra Game"
			: "Allow HTTP access to Hydra Game",
		ingress: securityGroupIngress,
		egress: [
			{
				protocol: "-1",
				fromPort: 0,
				toPort: 0,
				cidrBlocks: ["0.0.0.0/0"],
			},
		],
	},
	{ provider },
);

// Get the latest Amazon Linux 2 AMI
const ami = aws.ec2.getAmi(
	{
		filters: [
			{
				name: "name",
				values: ["amzn2-ami-hvm-*-x86_64-gp2"],
			},
		],
		owners: ["amazon"],
		mostRecent: true,
	},
	{ provider },
);

// Startup script for the EC2 instance
const userData = `#!/bin/bash
set -e

# Update system and install base packages
yum update -y
yum install -y docker

# Start Docker service and add ec2-user to docker group
service docker start
chkconfig docker on
usermod -a -G docker ec2-user

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /home/ec2-user/hydra-game
cd /home/ec2-user/hydra-game
chown -R ec2-user:ec2-user /home/ec2-user/hydra-game

# Create docker-compose.yml file
cat > docker-compose.yml << 'EOF'
services:
  app:
    image: ghcr.io/${repoName}:latest
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - GITHUB_REPOSITORY=${repoName}
    restart: unless-stopped
    pull_policy: always

  # PostgreSQL database (opcional)
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hydra_game
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Create update script for easy image updates
cat > update-app.sh << 'EOF'
#!/bin/bash
echo "🔄 Atualizando aplicação Hydra Game..."
cd /home/ec2-user/hydra-game
docker-compose pull app
docker-compose up -d --force-recreate app
echo "✅ Aplicação atualizada com sucesso!"
EOF
chmod +x update-app.sh
chown ec2-user:ec2-user update-app.sh

# Create a systemd service to start the application after boot
cat > /etc/systemd/system/hydra-game.service << 'EOF'
[Unit]
Description=Hydra Game Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=ec2-user
Group=ec2-user
WorkingDirectory=/home/ec2-user/hydra-game
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl enable hydra-game.service
systemctl start hydra-game.service

# Wait for containers to be ready
sleep 30

# Show status
echo "🚀 Hydra Game implantado com sucesso!"
echo "📦 Usando imagem: ghcr.io/${repoName}:latest"
echo "🌐 Acesse a aplicação em: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5000"
`;

// Create the EC2 instance
const instanceConfig: InstanceArgs = {
	ami: ami.then((ami) => ami.id),
	instanceType: instanceType,
	securityGroups: [securityGroup.name],
	userData: userData,
	tags: {
		Name: "hydra-game",
	},
};

// Only add keyName if a key pair is configured
if (keyPairName) {
	instanceConfig.keyName = keyPairName;
}

const instance = new aws.ec2.Instance("hydra-game-instance", instanceConfig, {
	provider,
});

// Export the public IP and DNS of the instance
export const publicIp = instance.publicIp;
export const publicDns = instance.publicDns;

// Export connection info
export const appUrl = pulumi.interpolate`http://${instance.publicIp}:5000`;
export const sshCommand = keyPairName
	? pulumi.interpolate`ssh -i ~/.ssh/${keyPairName}.pem ec2-user@${instance.publicDns}`
	: "SSH not configured - no key pair specified";
