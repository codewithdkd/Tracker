# Daily Habit Tracker PRO Setup Instructions

This guide will walk you through linking the new Proportional Scoring frontend UI with your Google Sheet using Google Apps Script.

## 1. Setup the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new Blank Spreadsheet.
2. Name the document something like **Habit Tracker Database**.
3. **Important:** Rename the first default tab at the bottom to `Deepak`.
4. Click the `+` icon to add a second tab and name it `Shalini`.
5. On **both** tabs, copy and paste the following **23 headers** into Row 1 (A1 to W1):

`Date`, `Sleep Time`, `Wake Time`, `Sleep Hours`, `Left Home`, `Returned Home`, `Study Hours`, `Exercise Type`, `Exercise Mins`, `Steps`, `Calories`, `Stretching`, `Sunlight`, `Water`, `Junk Food`, `Sugar`, `Fruits/Juice`, `Phone Hours`, `No Phone AM`, `Meditation`, `Mood`, `Anger`, `Points`

## 2. Setup the Google Apps Script

1. In your Google Sheet, click on **Extensions** in the top menu, then select **Apps Script**.
2. A new tab will open with the code editor.
3. Delete any default code (`function myFunction() {...}`) and paste everything from the `backend.gs` file provided in this project into the editor.
4. Save the project by clicking the **Save** icon (💾) or pressing `Ctrl + S`. Name the project "Habit Tracker Backend" when prompted.

## 3. Deploy as a Web App

1. In the Apps Script editor, click the blue **Deploy** button in the top right corner.
2. Select **New deployment**.
3. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
4. Fill out the configuration:
   - **Description:** Version 3 (Mobile Friendly & Consolidated)
   - **Execute as:** `Me (your email)` -> *This is critical so the script has permission to write to your sheet.*
   - **Who has access:** `Anyone` -> *This is also critical so the frontend can send data without requiring users to log into Google.*
5. Click **Deploy**.
6. **Authorization Required:** Google will ask for permission. Click `Authorize access`, choose your Google Account, click `Advanced` at the bottom, and then `Go to Habit Tracker Backend (unsafe)` and `Allow`.
7. **Copy the Web app URL**. It will look something like `https://script.google.com/macros/s/.../exec`.

## 4. Connect Frontend to Backend

1. Open the `app.js` file located in this project directory.
2. At the very top of `app.js`, look for:
   `const WEB_APP_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";`
3. Replace the placeholder text inside the quotes with the URL you copied from Step 3.
   *(Example: `const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw.../exec";`)*
4. Save the `app.js` file.

## 5. Run Locally or Host on GitHub!

**Run Locally:**
1. Open the `index.html` file in any modern web browser on Desktop or Mobile.
2. The dashboard will automatically fetch your stats and past records.

**Host on GitHub Pages (Free & Easy):**
This app is 100% static (HTML, CSS, JS), making it perfect for GitHub Pages!
1. Create a new repository on your GitHub account.
2. Upload all the files (`index.html`, `style.css`, `app.js`, `README.md`).
3. Go to the repository **Settings** > **Pages**.
4. Under **Build and deployment**, select `Deploy from a branch`.
5. Select the `main` (or `master`) branch and click Save.
6. In a minute or two, GitHub will give you a live URL. You can now access your Habit Tracker from anywhere on your phone!
