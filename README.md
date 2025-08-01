Soil Farming Agent
==================

Welcome to the Soil Farming Agent!

This web app helps users assess soil quality, discover crop recommendations, and manage soil distributors—all powered by Firebase for secure, real-time data and authentication.

Features
--------

- User Roles:
  - Admin: Add new soil types and distributor details.
  - User: Select available soil types and have their choices tracked.

- Authentication:
  - Secure registration and login (uses Firebase Authentication - Email/Password).

- Real-Time Database:
  - Soil details and user selections are always up-to-date for everyone.

- Admin Dashboard:
  - Add soil types and distributors.
  - See a complete list of soil details.
  - View which users (by email) have selected each soil type.

- User Dashboard:
  - View all available soil types.
  - Select your preferred type.
  - Your selection is saved and shown to admins.

- Responsive UI:
  - Clean design with gradient backgrounds and modern fonts.
  - Works well on both desktop and mobile.


How to Use
----------

1. Open the homepage.
2. Click "Login" and choose your role (Admin or User).
3. Register or log in with your email and password.
4. As Admin: Fill out and submit the "Add Soil Detail" form. Your soils appear in the list and are available for users to select.
5. As User: Choose a soil type and submit your selection.
6. Admins can see a live-updating list of which users selected which soil type.


Local Setup
-----------

1. Clone this repository or copy the files to your project folder.

2. Create a Firebase project at https://console.firebase.google.com/

3. In Firebase:
   - Enable Authentication (Email/Password)
   - Create a Firestore database

4. Copy your Firebase project's config object from Project Settings. Paste it into `script.js` in place of the placeholder config.

5. For admins to add soils, you should grant their Firebase user account a custom claim: role "admin" using the Firebase Admin SDK. (See the Firebase docs for "setCustomUserClaims".)

6. Review or set your Firestore security rules. Here's an example for secure usage:

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /soilDetails/{docId} {
         allow read: if request.auth != null;
         allow write: if request.auth.token.email_verified && request.auth.token.role == "admin";
       }
       match /userSelections/{docId} {
         allow create: if request.auth != null;
         allow read, update, delete: if false;
       }
     }
   }

7. Open index.html in your browser, or use a simple static file server (like 'npx serve .') to preview.

8. Soil types, selections, and user info are all updated in real time!


Contact & Credits
-----------------
- Email: justysfaby@gmail.com
- Phone: +91 88700 99067

Icon by Icons8

----

Thank you for using Soil Farming Agent!
