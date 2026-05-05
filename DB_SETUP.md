# CalorieDB Setup Guide

To power the smart calorie calculators in your Habit Tracker, you need to set up a dedicated database in your Google Spreadsheet. The application will fetch this database and use it to instantly calculate calories based on whatever you type.

## 1. Create the New Tab
Open your Google Spreadsheet and add a brand new tab (sheet) at the bottom. 
**Rename the tab exactly to:** `CalorieDB`

## 2. Set Up the Columns
In your new `CalorieDB` tab, set up the headers exactly like this in Row 1:

| A | B | C | D | | F | G |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Food Name** | **Base Calories** | **Per Quantity** | **Unit** | *(leave empty)* | **Exercise Name** | **MET Value** |

*(Note: Column E is intentionally left empty as a spacer between Food and Exercises).*

## 3. How to Fill the Data

### Food Database (Columns A, B, C, D)
You must specify what the base calories represent.

| Food Name | Base Calories | Per Quantity | Unit |
| :--- | :--- | :--- | :--- |
| rice | 130 | 100 | gram |
| roti | 120 | 1 | piece |
| milk | 60 | 100 | ml |
| apple | 95 | 1 | piece |
| paneer | 265 | 100 | gram |
| chicken | 239 | 100 | gram |

**Important Rules:**
- Keep the `Food Name` lowercase if possible.
- `Unit` should ideally be standard formats like `gram`, `ml`, or `piece`.
- When you type "250" in the Quantity box and highlight the `gram` button for Rice, the app will instantly divide your 250 by 100 (from Col C), getting a multiplier of 2.5, and multiply it by 130 (from Col B) to give you 325 kcal!

### Exercise Database (Columns F & G)
MET (Metabolic Equivalent of Task) values calculate calories based on your body weight and the duration of the exercise.

| Exercise Name | MET Value |
| :--- | :--- |
| Walking | 3.5 |
| Running | 9.0 |
| Cycling | 6.0 |
| Swimming | 7.0 |
| Weightlifting | 4.0 |
| HIIT | 8.0 |
| Pilates | 3.5 |
| Push-ups | 3.8 |
| Pull-ups | 3.8 |
| Yoga | 3.0 |
| Stretching | 2.3 |
| Sports | 6.5 |

## 4. Re-Deploy Your Script
If you just added this code update to your project, make sure you open your Google Apps Script editor (`backend.gs`) and click:
**Deploy** -> **Manage Deployments** -> **Edit (Pencil Icon)** -> Set Version to **New Version** -> **Deploy**.
