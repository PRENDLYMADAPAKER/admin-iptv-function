const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Force logout a session by removing from DB
exports.forceLogout = functions.https.onCall(async (data, context) => {
  const { uid, deviceId } = data;
  if (!uid || !deviceId) throw new functions.https.HttpsError("invalid-argument", "Missing UID or Device ID.");

  const sessionRef = admin.database().ref(`sessions/${uid}/${deviceId}`);
  await sessionRef.remove();
  return { success: true };
});

// List all users (email + uid)
exports.listUsers = functions.https.onCall(async (_, context) => {
  const users = [];
  let nextPageToken;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    result.users.forEach(userRecord => {
      users.push({
        uid: userRecord.uid,
        email: userRecord.email || "No Email",
        disabled: userRecord.disabled || false
      });
    });
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return users;
});

// Disable (ban) a user
exports.disableUser = functions.https.onCall(async (data, context) => {
  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError("invalid-argument", "Missing UID");

  await admin.auth().updateUser(uid, { disabled: true });
  return { success: true };
});

// Enable (unban) a user
exports.enableUser = functions.https.onCall(async (data, context) => {
  const { uid } = data;
  if (!uid) throw new functions.https.HttpsError("invalid-argument", "Missing UID");

  await admin.auth().updateUser(uid, { disabled: false });
  return { success: true };
});
