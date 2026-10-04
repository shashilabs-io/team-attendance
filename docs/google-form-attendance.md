# Google Forms Attendance Integration Guide

This guide explains how to set up, configure, and connect a Google Form to the Team Attendance System.

---

## 1. Overview & Architecture

Attendance can be recorded through both **Discord** and **Google Forms**. Both sources utilize the identical backend attendance validation rules, session models, and MongoDB as the single source of truth.

```text
Google Form (Member Submission)
       ↓
Google Apps Script (onFormSubmit Trigger)
       ↓  (HTTPS POST with x-google-form-secret)
Express Backend (`/api/integrations/google-form/attendance`)
       ↓
Backend Validation (Zod + Member Verification + Name Matching)
       ↓
Attendance Service (Atomic Mongoose Transaction)
       ↓
MongoDB (Single Source of Truth)
       ↓
React Dashboard (Displays attendance with 🟣 Google Form / 🔵 Discord badges)
```

---

## 2. Google Form Questions & Exact Field Names

Create a new Google Form titled **"Team Attendance Portal"** with the following 5 fields:

| Question # | Question Title | Question Type | Required? | Options / Notes |
|---|---|---|---|---|
| **1** | `Registration Number` | Short answer | **Yes** | e.g. `24105110087` (Primary authoritative ID) |
| **2** | `Name` | Short answer | **Yes** | e.g. `Shashi Bhushan` (Must match registered team member name) |
| **3** | `Attendance Action` | Multiple choice or Dropdown | **Yes** | Options: `CHECK IN`, `CHECK OUT` |
| **4** | `Task` | Paragraph / Short answer | No (Optional) | Description of work or topic (default: `"Not specified"`) |
| **5** | `Remarks` | Paragraph | No (Optional) | Optional notes or session details |

> [!IMPORTANT]
> The **Registration Number** is the primary identifier checked against MongoDB. The **Name** is verified against the database record; submissions with mismatched names are rejected (`NAME_MISMATCH`).

---

## 3. Google Apps Script Configuration

1. In your Google Form editor, click the **three dots menu (⋮)** in the top right.
2. Select **Script editor** (`Apps Script`).
3. Replace the entire contents of `Code.gs` with the following production-ready script:

```javascript
/**
 * Team Attendance System - Google Form Webhook Trigger
 * Sends form responses directly to the backend attendance API.
 */

// Replace with your publicly accessible backend URL (or ngrok/tunnel URL during testing)
const BACKEND_WEBHOOK_URL = 'https://your-backend-domain.com/api/integrations/google-form/attendance';

// Must match the GOOGLE_FORM_WEBHOOK_SECRET environment variable in backend/.env
const WEBHOOK_SECRET = 'your-secret-here';

function onFormSubmit(e) {
  try {
    const itemResponses = e.response.getItemResponses();
    let registrationNo = '';
    let name = '';
    let action = '';
    let task = '';
    let remarks = '';

    for (let i = 0; i < itemResponses.length; i++) {
      const title = itemResponses[i].getItem().getTitle().trim();
      const response = itemResponses[i].getResponse();

      if (/registration\s*(number|no)/i.test(title)) {
        registrationNo = String(response).trim();
      } else if (/^name$/i.test(title)) {
        name = String(response).trim();
      } else if (/attendance\s*action|action/i.test(title)) {
        action = String(response).trim();
      } else if (/^task/i.test(title)) {
        task = String(response).trim();
      } else if (/^remark/i.test(title)) {
        remarks = String(response).trim();
      }
    }

    if (!registrationNo || !name || !action) {
      Logger.log('Missing required fields: registrationNo, name, or action');
      return;
    }

    const payload = {
      registrationNo: registrationNo,
      name: name,
      action: action,
      task: task,
      remarks: remarks,
      submissionId: e.response.getId(), // Unique Google Form Response ID for idempotency
      submittedAt: e.response.getTimestamp().toISOString()
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-google-form-secret': WEBHOOK_SECRET
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(BACKEND_WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    Logger.log('Status: ' + responseCode + ' Response: ' + responseBody);
  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.toString());
  }
}
```

### Setting up the Trigger:
1. In the Apps Script sidebar, click the **Triggers (⏰ clock icon)**.
2. Click **+ Add Trigger** (bottom right).
3. Set:
   - **Choose which function to run:** `onFormSubmit`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From form`
   - **Select event type:** `On form submit`
4. Click **Save** and grant permissions if prompted.

---

## 4. Environment Secret Configuration

In `backend/.env`, set:
```env
GOOGLE_FORM_WEBHOOK_SECRET=your-secret-here
```

In `backend/.env.example`:
```env
GOOGLE_FORM_WEBHOOK_SECRET=your-secret-here
```

---

## 5. Webhook Request & Payload Specifications

### Endpoint
`POST /api/integrations/google-form/attendance`

### Headers
```http
Content-Type: application/json
x-google-form-secret: your-secret-here
```

### JSON Body Example
```json
{
  "registrationNo": "24105110087",
  "name": "Shashi Bhushan",
  "action": "CHECK IN",
  "task": "Building web interface of attendance system",
  "remarks": "Submitted via Google Form",
  "submissionId": "2_ABaOnuQ...",
  "submittedAt": "2026-10-04T06:30:00.000Z"
}
```

---

## 6. How CHECK IN & CHECK OUT Work

### Check-In Workflow:
1. Backend validates that `x-google-form-secret` is present and matches `GOOGLE_FORM_WEBHOOK_SECRET`.
2. Validates registration number against `users` collection in MongoDB.
3. Compares submitted name with MongoDB user name (case-insensitive & trimmed).
4. Verifies team member is `isActive === true`.
5. Checks if member already has an `ACTIVE` session. If yes, returns error `ALREADY_CHECKED_IN`.
6. Checks if `submissionId` was previously processed to avoid duplicate check-ins.
7. Creates an `AttendanceSession` document with `status = "ACTIVE"`, `source = "GOOGLE_FORM"`, and current server timestamp.
8. Creates a `CHECK_IN` `AttendanceEvent` with `source = "GOOGLE_FORM"`.
9. Responds with HTTP 200:
   ```json
   {
     "success": true,
     "data": {
       "action": "CHECK_IN",
       "message": "Attendance checked in successfully"
     }
   }
   ```

### Check-Out Workflow:
1. Backend validates member and matches registration number and name.
2. Queries MongoDB for the member's current `ACTIVE` attendance session.
3. If no active session exists, returns error `NO_CHECK_IN`.
4. Calculates duration in whole minutes between `checkIn` and current server timestamp.
5. Updates `AttendanceSession` with `status = "COMPLETED"`, `checkOut` timestamp, `durationMinutes`, and optional task update.
6. Creates a `CHECK_OUT` `AttendanceEvent` with duration and `source = "GOOGLE_FORM"`.
7. Responds with HTTP 200:
   ```json
   {
     "success": true,
     "data": {
       "action": "CHECK_OUT",
       "message": "Attendance checked out successfully"
     }
   }
   ```

---

## 7. Interoperability Between Discord and Google Forms

Because both Discord bot commands and Google Forms use the exact same underlying Mongoose models and attendance service:
- **Cross-Platform Scenario A:** Check in on Google Forms ➡️ Check out on Discord using `co` or `/co`.
- **Cross-Platform Scenario B:** Check in on Discord using `ci` or `/ci` ➡️ Check out on Google Forms.

Both are 100% interoperable and synchronized in real time.

---

## 8. Error Codes Reference

| Error Code | HTTP Status | Reason |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or incorrect `x-google-form-secret` header. |
| `VALIDATION_ERROR` | 400 | Missing required fields, empty string, or invalid action. |
| `USER_NOT_FOUND` | 404 | Registration number is not found in MongoDB `users` collection. |
| `USER_INACTIVE` | 400 | Team member's account has `isActive: false`. |
| `NAME_MISMATCH` | 400 | Submitted name does not match the registered team member name. |
| `ALREADY_CHECKED_IN` | 400 | Team member already has an active check-in session. |
| `NO_CHECK_IN` | 400 | Attempted to check out without an active check-in session. |
| `DUPLICATE_SUBMISSION` | 409 | Exact same Google Form response ID already processed. |

---

## 9. Testing Procedure

### Manual Curl Test:

1. **Test Check-In:**
   ```bash
   curl -X POST http://localhost:5000/api/integrations/google-form/attendance \
     -H "Content-Type: application/json" \
     -H "x-google-form-secret: your-secret-here" \
     -d '{
       "registrationNo": "24105110087",
       "name": "Shashi Bhushan",
       "action": "CHECK_IN",
       "task": "Testing Google Forms integration"
     }'
   ```

2. **Test Check-Out:**
   ```bash
   curl -X POST http://localhost:5000/api/integrations/google-form/attendance \
     -H "Content-Type: application/json" \
     -H "x-google-form-secret: your-secret-here" \
     -d '{
       "registrationNo": "24105110087",
       "name": "Shashi Bhushan",
       "action": "CHECK_OUT"
     }'
   ```

### Automated Backend Test Suite:
Run the comprehensive 17-point automated test suite from the backend directory:
```bash
npm run test:googleform
```
