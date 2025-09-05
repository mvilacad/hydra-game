# Pulumi AWS Deployment Setup

This Pulumi configuration will automatically use your AWS CLI credentials and settings.

## Prerequisites

1. **AWS CLI configured**: Make sure you have AWS CLI set up with your credentials
   ```bash
   aws configure
   ```

2. **EC2 Key Pair**: Create a key pair in AWS Console or use existing one
   - Go to AWS Console > EC2 > Key Pairs
   - Create a key pair named "default" or set a custom name in config

## Quick Start

1. **Deploy the infrastructure:**
   ```bash
   cd pulumi
   pulumi up
   ```

2. **Access your application:**
   - The app will be available at the `appUrl` output (http://your-ip:5000)
   - SSH access via the `sshCommand` output

## Configuration

You can customize the deployment by editing `Pulumi.dev.yaml`:

```yaml
config:
  hydra-game:instanceType: t2.micro    # Change instance size
  hydra-game:keyPairName: my-key-pair  # Use custom key pair name
```

## What Gets Deployed

- **EC2 Instance** (t2.micro by default)
- **Security Group** (allows ports 22, 5000)
- **Auto-deployment** via user data script that:
  - Installs Docker and docker-compose
  - Clones the repository
  - Starts the application

The application will be running automatically after deployment completes (~5-10 minutes).

## Commands

- `pulumi preview` - See what changes will be made
- `pulumi up` - Deploy the infrastructure
- `pulumi destroy` - Remove all resources
- `pulumi stack output` - Show deployment outputs