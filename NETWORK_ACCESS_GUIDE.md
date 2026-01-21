# Network Access Guide - Accessing Charlotte from Other Devices

This guide explains how to access the Charlotte Timetable application from other devices on your local network (e.g., phones, tablets, other computers).

## What's Been Configured

The application is now configured to be accessible across your local network:

- **Backend (Flask)**: Already configured to listen on `0.0.0.0:5000` (all network interfaces)
- **Frontend (Vite)**: Now configured to listen on `0.0.0.0:3000` (all network interfaces)

## Step-by-Step Instructions

### 1. Start the Application

Start both the backend and frontend servers as normal:

**Backend:**
```bash
cd backend
python app.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 2. Find Your Server's IP Address

You need to find the IP address of the computer running the application.

#### On Windows:

1. Open Command Prompt (press Windows + R, type `cmd`, press Enter)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter (usually "Ethernet" or "Wi-Fi")
4. Example: `192.168.1.100`

```cmd
ipconfig
```

#### On macOS:

1. Open Terminal
2. Type: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Look for your local IP address
4. Example: `192.168.1.100`

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### On Linux:

```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

Or:

```bash
hostname -I
```

### 3. Access from Other Devices

Once you have your server's IP address (e.g., `192.168.1.100`):

#### Frontend (Main Application):
```
http://192.168.1.100:3000/timetable/
```

#### Backend API (if needed):
```
http://192.168.1.100:5000
```

**Important:** Replace `192.168.1.100` with your actual IP address!

### 4. Verify Network Connectivity

Ensure both devices are on the same network:
- Both must be connected to the same Wi-Fi network or router
- Corporate/school networks may block device-to-device communication
- Some routers have "AP Isolation" enabled which blocks devices from seeing each other

## Firewall Configuration

If you can't connect from other devices, you may need to allow the ports through your firewall:

### Windows Firewall:

1. Open "Windows Defender Firewall with Advanced Security"
2. Click "Inbound Rules" > "New Rule"
3. Choose "Port" > "TCP" > Specific ports: `3000, 5000`
4. Allow the connection
5. Apply to Domain, Private, and Public (or just Private for home networks)
6. Name it "Charlotte Timetable"

### macOS Firewall:

1. System Preferences > Security & Privacy > Firewall
2. Click "Firewall Options"
3. Add Python and Node to allowed apps

### Linux (ufw):

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
```

## Environment Variables (Optional)

If you need to point the frontend to a different backend server, create a `.env.local` file in the `frontend` directory:

```env
VITE_API_URL=http://192.168.1.100:5000
```

This allows you to override the default backend URL without changing the code.

## Security Considerations

⚠️ **Important Security Notes:**

1. **Local Network Only**: This configuration allows access from your local network only. The application is NOT exposed to the internet.

2. **Production**: Do NOT use this setup for production deployments. For production:
   - Use proper HTTPS certificates
   - Configure proper authentication
   - Use a reverse proxy (nginx/Apache)
   - Implement rate limiting
   - Follow the production deployment guide

3. **Sensitive Data**: Be mindful of who has access to your local network when the application contains sensitive data.

4. **Public Wi-Fi**: Avoid running the server on public Wi-Fi networks where untrusted users might access it.

## Troubleshooting

### Can't Connect from Other Devices

1. **Verify Same Network**: Ensure both devices are on the same network
2. **Check Firewall**: Temporarily disable firewall to test (re-enable after!)
3. **Check IP Address**: Make sure you're using the correct IP address
4. **Ping Test**: From the other device, try pinging the server:
   ```bash
   ping 192.168.1.100
   ```

### Connection Refused

- Make sure both backend and frontend servers are running
- Check that the servers started without errors
- Verify the ports aren't already in use by other applications

### API Not Working

- The frontend proxy is configured to forward `/api` requests to the backend
- If accessing the frontend from a different device, ensure the backend is accessible
- You may need to update the proxy target in `vite.config.ts` to use your server's IP instead of `127.0.0.1`

### Mixed Content Errors

- If you see "Mixed Content" errors, ensure both frontend and backend use the same protocol (both HTTP or both HTTPS)
- For local development, HTTP is fine

## Advanced: Accessing from Different Subnets

If you need to access from a different subnet (e.g., from a VPN), you'll need:

1. Proper routing configured on your network
2. Update backend proxy configuration in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://YOUR_SERVER_IP:5000',
    changeOrigin: true,
  },
}
```

## Quick Reference

| Service | Port | Local URL | Network URL Example |
|---------|------|-----------|---------------------|
| Frontend | 3000 | http://localhost:3000/timetable/ | http://192.168.1.100:3000/timetable/ |
| Backend | 5000 | http://localhost:5000 | http://192.168.1.100:5000 |

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access frontend from server itself (localhost:3000/timetable/)
- [ ] Found server's IP address
- [ ] Can ping server from other device
- [ ] Can access frontend from other device using IP address
- [ ] Application functions correctly from other device
- [ ] Firewall rules configured (if needed)

## Getting Help

If you continue to have issues:

1. Check the console output from both backend and frontend for errors
2. Check your browser's developer console (F12) for JavaScript errors
3. Verify network connectivity with basic ping/traceroute
4. Check your router's settings for AP Isolation or client isolation features
5. Try accessing from a web browser on the same computer first to verify the application works

---

**Remember**: This configuration is for local development and testing. Always follow proper security practices for production deployments!
