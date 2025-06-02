# iOS Ad-hoc Distribution Setup Guide

This guide explains how to set up your GitHub repository to build iOS apps for ad-hoc distribution without using EAS (Expo Application Services).

## Prerequisites

1. **Apple Developer Account** - You need a paid Apple Developer account ($99/year)
2. **iOS Development Certificate** - For signing your app
3. **Ad-hoc Provisioning Profile** - For distributing outside the App Store
4. **Device UDIDs** - For devices that will install the app

## Step 1: Generate iOS Certificate

### Using Xcode (Recommended):
1. Open Xcode
2. Go to **Xcode > Preferences > Accounts**
3. Add your Apple ID and select your team
4. Click **Manage Certificates**
5. Click the **+** button and select **iOS Distribution**
6. Export the certificate:
   - Open **Keychain Access**
   - Find your **iPhone Distribution** certificate
   - Right-click and select **Export**
   - Choose **Personal Information Exchange (.p12)**
   - Set a password and remember it

### Using Apple Developer Portal:
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Certificates** then **+** to create new
4. Select **iOS Distribution (App Store and Ad Hoc)**
5. Follow the instructions to generate and download

## Step 2: Create App Identifier

1. In Apple Developer Portal, go to **Identifiers**
2. Click **+** to create new App ID
3. Select **App IDs** and continue
4. Choose **App** type and continue
5. Fill in:
   - **Description**: Your app name
   - **Bundle ID**: e.g., `com.yourcompany.obsapp` (must be unique)
6. Select required capabilities
7. Click **Continue** and **Register**

## Step 3: Register Device UDIDs

For ad-hoc distribution, you must register each device that will install the app:

1. Go to **Devices** in Apple Developer Portal
2. Click **+** to add devices
3. For each device, you need:
   - **Device Name**: Any name to identify the device
   - **Device ID (UDID)**: Get this from the device

### How to get UDID:
- **iPhone/iPad**: Connect to computer → Open Finder → Select device → Copy identifier
- **Using iTunes**: Connect device → Click device → Click serial number to reveal UDID
- **Settings app**: Settings → General → About → scroll down (varies by iOS version)

## Step 4: Create Provisioning Profile

1. In Apple Developer Portal, go to **Profiles**
2. Click **+** to create new
3. Select **Ad Hoc** under Distribution
4. Select your App ID created in Step 2
5. Select your iOS Distribution certificate
6. Select all devices that should be able to install the app
7. Enter a profile name (e.g., "OBS App Ad Hoc")
8. Click **Generate** and download the `.mobileprovision` file

## Step 5: Configure GitHub Secrets

Add these secrets to your GitHub repository (**Settings → Secrets and variables → Actions**):

### Required Secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `APPLE_CERT_DATA` | Base64 encoded .p12 certificate | `base64 -i certificate.p12 | pbcopy` (macOS) or `base64 certificate.p12` (Linux) |
| `APPLE_CERT_PASSWORD` | Password for the .p12 certificate | The password you set when exporting |
| `APPLE_PROVISIONING_PROFILE_DATA` | Base64 encoded .mobileprovision file | `base64 -i profile.mobileprovision | pbcopy` (macOS) |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID | Found in Apple Developer Portal under membership |
| `IOS_BUNDLE_IDENTIFIER` | Bundle identifier from Step 2 | e.g., `com.yourcompany.obsapp` |
| `KEYCHAIN_PASSWORD` | Password for build keychain | Any secure password (used only during build) |
| `IPA_DOWNLOAD_URL` | HTTPS URL where you'll host the files | e.g., `https://yourdomain.com/downloads` |

### Getting Your Team ID:
1. Go to Apple Developer Portal
2. Click your name in top right
3. Select **View Membership**
4. Your Team ID is shown there (10 characters, e.g., `ABC1234567`)

### Encoding Files to Base64:

**macOS/Linux:**
```bash
# For certificate
base64 -i YourCertificate.p12 | pbcopy

# For provisioning profile  
base64 -i YourProfile.mobileprovision | pbcopy
```

**Windows:**
```powershell
# For certificate
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourCertificate.p12"))

# For provisioning profile
[Convert]::ToBase64String([IO.File]::ReadAllBytes("YourProfile.mobileprovision"))
```

## Step 6: Update App Configuration

Ensure your `app.json` has the iOS bundle identifier:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.obsapp"
    }
  }
}
```

## Step 7: Run the Workflow

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build iOS Ad-hoc Distribution**
4. Click **Run workflow**
5. Choose build type (`adhoc` or `enterprise`)
6. Choose version bump if needed
7. Click **Run workflow**

## Step 8: Install the App

After the workflow completes:

1. Download the artifacts from the workflow run
2. Extract the zip file containing:
   - `obsapp.ipa` - The app file
   - `manifest.plist` - Installation manifest
   - `install.html` - Installation webpage
   - `build-info.json` - Build metadata

3. Host these files on an HTTPS web server

4. On iOS devices:
   - Open the `install.html` page in Safari
   - Tap **Install on iOS Device**
   - Follow the installation prompts
   - Go to **Settings → General → Device Management**
   - Trust your developer profile

## Troubleshooting

### Common Issues:

1. **"Unable to install app"**
   - Check that device UDID is registered in provisioning profile
   - Ensure bundle identifier matches exactly
   - Verify certificate hasn't expired

2. **Build fails at code signing**
   - Check that `APPLE_TEAM_ID` is correct
   - Verify certificate is valid and not expired
   - Ensure provisioning profile includes the certificate

3. **"Untrusted Developer"**
   - Go to Settings → General → Device Management
   - Find your developer profile and tap Trust

4. **Installation link doesn't work**
   - Ensure files are hosted on HTTPS (not HTTP)
   - Check that manifest.plist URL is accessible
   - Verify bundle identifier in manifest matches app

### Useful Commands:

```bash
# Check certificate details
openssl pkcs12 -info -in certificate.p12

# View provisioning profile details
security cms -D -i profile.mobileprovision

# Check if device is registered
# Look for your device UDID in the provisioning profile output above
```

## Security Notes

- Keep your certificates and provisioning profiles secure
- Rotate certificates before they expire (usually 1 year)
- Remove device access by creating new provisioning profiles without those devices
- Monitor your Apple Developer account for unauthorized certificates

## Limitations

- **Ad-hoc distribution**: Limited to 100 devices per year
- **Device registration**: Each device must be explicitly registered
- **Certificate expiry**: Apps stop working when certificates expire
- **Annual renewal**: Apple Developer membership must be renewed yearly

For broader distribution without device limits, consider:
- App Store distribution (requires App Store review)
- Enterprise distribution (requires Apple Developer Enterprise account - $299/year)
- TestFlight (App Store Connect, limited to 10,000 beta testers) 