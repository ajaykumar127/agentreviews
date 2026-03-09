# OAuth Setup Guide for Heroku Deployment

## Problem
The Salesforce CLI's default Connected App (`PlatformCLI`) only works with `localhost` redirect URIs. For production deployment on Heroku, you need to create a custom Connected App.

## Solution: Create a Custom Connected App

### Step 1: Create Connected App in Salesforce

1. **Login to Salesforce** as an administrator
2. Go to **Setup** → Search for **App Manager**
3. Click **New Connected App**

### Step 2: Fill in the Details

**Basic Information:**
- **Connected App Name**: `Agentforce Agent Review` (or any name you prefer)
- **API Name**: Auto-generated (e.g., `Agentforce_Agent_Review`)
- **Contact Email**: Your email address

**API (Enable OAuth Settings):**
- ✅ Check **Enable OAuth Settings**
- **Callback URL**:
  ```
  https://agentreview-74953dba67a9-131c6398b543.herokuapp.com/OauthRedirect
  ```
  (Replace with your actual Heroku URL if different)

- **Selected OAuth Scopes**: Add these scopes:
  - ✅ Access and manage your data (api)
  - ✅ Perform requests on your behalf at any time (refresh_token, offline_access)
  - ✅ Access unique user identifiers (openid)

- **Require Secret for Web Server Flow**: ✅ Check this
- **Require Secret for Refresh Token Flow**: ✅ Check this

### Step 3: Save and Wait

1. Click **Save**
2. Wait **2-10 minutes** for the Connected App to be activated
3. You'll see a message: "The Connected App is being registered. It may take up to 10 minutes for the changes to take effect."

### Step 4: Get Your Credentials

1. Go back to **App Manager** → Find your Connected App
2. Click the dropdown → **View**
3. Click **Manage Consumer Details** button
4. You may need to verify with 2FA
5. Copy these values:
   - **Consumer Key** (this is your Client ID)
   - **Consumer Secret** (this is your Client Secret)

### Step 5: Set Environment Variables on Heroku

Run these commands (replace with your actual values):

```bash
heroku config:set SALESFORCE_CLIENT_ID="your_consumer_key_here" -a agentreview-74953dba67a9

heroku config:set SALESFORCE_CLIENT_SECRET="your_consumer_secret_here" -a agentreview-74953dba67a9
```

Or set them in Heroku Dashboard:
1. Go to https://dashboard.heroku.com/apps/agentreview-74953dba67a9/settings
2. Click **Reveal Config Vars**
3. Add:
   - Key: `SALESFORCE_CLIENT_ID`, Value: Your Consumer Key
   - Key: `SALESFORCE_CLIENT_SECRET`, Value: Your Consumer Secret

### Step 6: Restart the Heroku App

```bash
heroku restart -a agentreview-74953dba67a9
```

### Step 7: Test OAuth Login

1. Go to https://agentreview-74953dba67a9-131c6398b543.herokuapp.com/
2. Switch to **OAuth Login** tab
3. Select your environment and click **Login with Salesforce OAuth**
4. You should be redirected to Salesforce login
5. After login, you'll be redirected back to the app

## Alternative: Use Direct Login (Username/Password)

If you don't want to set up OAuth, you can use the **Direct Login** method:

1. Use the **Direct Login** tab (default)
2. Enter:
   - **Salesforce URL**: Your org URL (e.g., `https://mycompany.my.salesforce.com`)
   - **Username**: Your Salesforce username
   - **Password**: Your password
   - **Security Token**: Your security token (if required)
     - Get token: Setup → Reset My Security Token → Check your email
     - If IP is whitelisted, leave blank

**Note**: Direct Login requires:
- API Enabled permission on your user
- Correct security token if your IP isn't whitelisted
- Password + Security Token combined (enter both in password field if needed)

## Troubleshooting

### OAuth Error: "redirect_uri_mismatch"
- Make sure the callback URL in your Connected App **exactly** matches your Heroku URL
- Check for trailing slashes (shouldn't have any)
- Verify the environment variables are set correctly

### Direct Login Error: "Invalid username, password, security token"
- Verify credentials in Salesforce directly
- Try resetting security token: Setup → Reset My Security Token
- Append security token to password: `yourPassword123yourSecurityToken`
- Check if API access is enabled for your user

### Direct Login Error: "Could not extract session information"
- This might be a jsforce compatibility issue
- Try OAuth method instead (recommended for production)
- Verify your Salesforce URL format is correct

## Security Notes

- **Never commit** your Client Secret to git
- Keep environment variables secure
- Use OAuth for production (more secure than direct login)
- Direct login credentials are never stored, only used to get session token
