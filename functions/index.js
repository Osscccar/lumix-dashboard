const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// Function that runs every minute to check for pending reminders
exports.processQuestionnaireReminders = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    console.log(`Running reminder scheduler at ${new Date(now).toISOString()}`);

    try {
      // Get all pending reminders
      const remindersRef = admin.database().ref('questionnaireReminders');
      const snapshot = await remindersRef.once('value');
      
      if (!snapshot.exists()) {
        console.log('No reminders found in database');
        return null;
      }

      const pendingReminders = [];
      
      // Filter reminders that are due
      snapshot.forEach((childSnapshot) => {
        const reminder = childSnapshot.val();
        if (reminder.status === 'pending' && reminder.sendAt <= now) {
          pendingReminders.push({
            id: childSnapshot.key,
            data: reminder
          });
        }
      });

      console.log(`Found ${pendingReminders.length} reminders to process`);
      
      // Process each reminder
      for (const reminder of pendingReminders) {
        try {
          // Send the email directly from the Cloud Function
          // rather than calling your API
          await processReminder(reminder.id, reminder.data);
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          
          // Update reminder as failed
          await remindersRef.child(reminder.id).update({
            status: 'failed',
            error: error.message || 'Unknown error',
            processedAt: now
          });
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in reminder processor:', error);
      return null;
    }
  });

// Helper function to process a single reminder
async function processReminder(reminderId, reminderData) {
  const { userId, email, reminderNumber } = reminderData;
  const now = Date.now();
  const remindersRef = admin.database().ref('questionnaireReminders');
  
  console.log(`Processing reminder ${reminderId} for ${email}`);
  
  try {
    // Send email using your existing email service
    const mailgun = require('mailgun-js')({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    });
    
    const isFirstReminder = reminderNumber === 1;
    
    const subject = isFirstReminder
      ? "Complete your Lumix Digital questionnaire"
      : "Reminder: Your website questionnaire is waiting";
      
    const data = {
      from: process.env.MAILGUN_FROM_EMAIL || "noreply@lumixdigital.com.au",
      to: email,
      subject: subject,
      text: `It's time to complete your website questionnaire. Visit https://app.lumixdigital.com.au/questionnaire to get started.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://lumixdigital.com.au/images/logo.png" alt="Lumix Digital" style="max-width: 150px;" />
          </div>
          <h2 style="color: #F58327; text-align: center;">
            ${
              isFirstReminder
                ? "Time to Complete Your Website Questionnaire"
                : "Don't Forget Your Website Questionnaire"
            }
          </h2>
          <p>${
            isFirstReminder
              ? "Thanks for choosing Lumix Digital! To get started on your website build, we need some information from you."
              : "We noticed you haven't completed your website questionnaire yet. Your input is essential for us to create your perfect website."
          }</p>
          
          <p>The questionnaire will help us understand your business needs and design preferences.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.lumixdigital.com.au/questionnaire" 
               style="background-color: #F58327; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Complete Questionnaire Now
            </a>
          </div>
          
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} Lumix Digital. All rights reserved.</p>
          </div>
        </div>
      `,
    };
    
    // Send email using Mailgun directly
    const result = await mailgun.messages().send(data);
    
    console.log(`Email sent successfully: ${result.id}`);
    
    // Update reminder status to sent
    await remindersRef.child(reminderId).update({
      status: 'sent',
      sentAt: now,
      processedAt: now,
      messageId: result.id
    });
    
    // Also update user record in Firestore to mark reminder as sent
    const userRef = admin.firestore().collection('users').doc(userId);
    
    if (reminderNumber === 1) {
      await userRef.update({
        firstReminderSent: true,
        firstReminderSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await userRef.update({
        secondReminderSent: true,
        secondReminderSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to send email for reminder ${reminderId}:`, error);
    
    // Update reminder as failed
    await remindersRef.child(reminderId).update({
      status: 'failed',
      error: error.message || 'Unknown error',
      processedAt: now
    });
    
    throw error;
  }
}