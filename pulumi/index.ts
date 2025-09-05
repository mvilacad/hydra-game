import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";

// Configure AWS provider to use local AWS CLI credentials
const provider = new aws.Provider("aws-provider", {
    region: aws.config.region || "us-east-1", // Uses AWS CLI default region
    // Pulumi will automatically use AWS CLI credentials from ~/.aws/credentials
});

// Read configuration values from Pulumi.dev.yaml
const config = new pulumi.Config();
const instanceType = config.get("instanceType") || "t2.micro";

// The URL of the repository to clone
// FIXME: Replace this with your repository URL
const repoUrl = "https://github.com/matheuss-pinheiro/hydra-game.git";

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

const securityGroup = new aws.ec2.SecurityGroup("hydra-game-sg", {
    description: keyPairName ? "Allow HTTP and SSH access to Hydra Game" : "Allow HTTP access to Hydra Game",
    ingress: securityGroupIngress,
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
}, { provider });

// Get the latest Amazon Linux 2 AMI
const ami = aws.ec2.getAmi({
    filters: [
        {
            name: "name",
            values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
    ],
    owners: ["amazon"],
    mostRecent: true,
}, { provider });

// Startup script for the EC2 instance
const userData = `#!/bin/bash
yum update -y
yum install -y git docker
service docker start
usermod -a -G docker ec2-user

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Clone the repository and start the application
cd /home/ec2-user
git clone ${repoUrl}
cd hydra-game
docker-compose up -d
`;

// Create the EC2 instance
const instanceConfig: any = {
    ami: ami.then(ami => ami.id),
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

const instance = new aws.ec2.Instance("hydra-game-instance", instanceConfig, { provider });

// Export the public IP and DNS of the instance
export const publicIp = instance.publicIp;
export const publicDns = instance.publicDns;

// Export connection info
export const appUrl = pulumi.interpolate`http://${instance.publicIp}:5000`;
export const sshCommand = keyPairName 
    ? pulumi.interpolate`ssh -i ~/.ssh/${keyPairName}.pem ec2-user@${instance.publicDns}`
    : "SSH not configured - no key pair specified";