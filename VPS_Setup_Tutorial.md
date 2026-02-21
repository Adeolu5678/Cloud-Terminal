VPS & Environment Setup Tutorial
Preparing Your Cloud Workspace
This guide assumes you have redeemed your GitHub Student Developer Pack and have access to DigitalOcean.
Part 1: Getting the Server
Login to DigitalOcean (using your GitHub credits).
Create a Droplet:
Region: Choose the one closest to you (to minimize typing latency).
OS: Ubuntu 24.04 (LTS) x64.
Size: The "Basic" plan. The $6/month (1GB RAM) or $12/month (2GB RAM) is sufficient.
Authentication: SSH Key (Recommended). Upload your laptop's public key. If you are unsure, choose "Password" for now (easier setup but less secure).
Launch: Wait for the IP address to be assigned.
Part 2: Essential Tooling
Connect to your VPS from your laptop terminal: ssh root@<YOUR_VPS_IP>
1. Update & Secure
apt update && apt upgrade -y
# Install essential build tools (needed for node-pty)
apt install -y build-essential python3 make g++ git curl


2. Install Node.js (via NVM)
We need a specific version of Node.
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash
source ~/.bashrc
nvm install 20
nvm use 20


3. Install Tmux (The Session Manager)
Ubuntu usually comes with it, but let's ensure we have the latest.
apt install -y tmux


Optional: Make tmux pretty.
If you want a status bar like the screenshots, create a config:
touch ~/.tmux.conf
# You can paste custom configs here later to change colors/status bar


4. Install Kilo Code CLI (Your AI Agent)
Since you use this on your laptop, install it here.
# (Assuming Kilo install command - replace with actual install script if different)
curl -sL [https://kilo.code/install](https://kilo.code/install) | bash
# You will likely need to authenticate Kilo. 
# Run `kilo login` and follow the instructions.


Part 3: Configuring the "Manual OpenClaw" Environment
We want your server to automatically have your agents ready when you connect.
1. Create a Startup Script
Create a file named start-workspace.sh in your home directory:
nano ~/start-workspace.sh


Paste this content (this sets up your "Agents"):
#!/bin/bash
SESSION="cloud-term"

# Check if session exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  # Create New Session named 'cloud-term' with first window 'Shell'
  tmux new-session -d -s $SESSION -n "Shell"

  # Create Window 2: 'Kilo-Coder'
  tmux new-window -t $SESSION:1 -n "Kilo-Coder"
  tmux send-keys -t $SESSION:1 "echo 'Waiting for Kilo Code instructions...'" C-m

  # Create Window 3: 'Kilo-Research'
  tmux new-window -t $SESSION:2 -n "Kilo-Research"
  tmux send-keys -t $SESSION:2 "echo 'Ready to browse web...'" C-m

  # Select first window
  tmux select-window -t $SESSION:0
fi

# Attach to session
tmux attach -t $SESSION


Make it executable:
chmod +x ~/start-workspace.sh


Part 4: Exposing to the Web (HTTPS)
For your PWA to work on your phone, the backend must be served over HTTPS. The easiest free way to do this without complex Nginx/Certbot config is Cloudflare Tunnel.
Sign up for Cloudflare (Free).
Add a domain (If you have one via GitHub Student Pack, e.g., Namecheap). If you don't have a domain, you can use ngrok (free tier) for temporary testing, but Cloudflare Tunnel is better for permanent setups.
Setup Tunnel: In Cloudflare Dashboard > Zero Trust > Access > Tunnels:
Create a tunnel.
It will give you a command to run on your VPS (e.g., cloudflared service install...).
Run that command on your VPS.
Configure the Route: Point a subdomain (e.g., term.yourdomain.com) to http://localhost:3000 (assuming your Node app runs on port 3000).
Now, https://term.yourdomain.com will securely pipe traffic to your localhost Node server.

Part 5: Cloning Your App (Future Step)
Once we write the code in the next steps, you will:
Push your code to GitHub.
Clone it on this VPS: git clone https://github.com/youruser/cloud-term.git
Install deps: npm install
Run it: npm start

