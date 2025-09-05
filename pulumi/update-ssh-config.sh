#!/bin/bash
# Script to update SSH config with current server hostname

# Get current server hostname from Pulumi
SERVER_DNS=$(pulumi stack output publicDns 2>/dev/null)

if [ -n "$SERVER_DNS" ]; then
    echo "Updating SSH config with server: $SERVER_DNS"
    
    # Update SSH config
    sed -i.bak "s/HostName ec2-.*/HostName $SERVER_DNS/" ~/.ssh/config
    
    echo "✅ SSH config updated! You can now connect with:"
    echo "   ssh dev-server"
else
    echo "❌ Could not get server hostname from Pulumi. Make sure deployment is complete."
fi