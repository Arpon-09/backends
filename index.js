const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = require("./serviceAccountKey.json"); // your downloaded JSON

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com" // replace with your DB URL
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Endpoint to send notification
app.post("/sendNotification", async (req, res) => {
    try {
        const { title, message } = req.body;

        // Get all admin tokens
        const adminsSnapshot = await admin.database().ref("Admins").get();
        if (!adminsSnapshot.exists()) return res.status(200).send("No admins found");

        const tokens = [];
        adminsSnapshot.forEach(adminSnap => {
            const token = adminSnap.child("fcmToken").val();
            if (token) tokens.push(token);
        });

        if (tokens.length === 0) return res.status(200).send("No tokens found");

        // Create payload
        const payload = {
            notification: { title, body: message }
        };

        // Send notification
        const response = await admin.messaging().sendToDevice(tokens, payload);
        console.log("Notifications sent:", response.successCount);
        res.status(200).send({ success: true, sent: response.successCount });

    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
