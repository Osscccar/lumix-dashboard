// src/lib/email-service.ts
import formData from "form-data";
import Mailgun from "mailgun.js";

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "",
});

// Update the return type to include 'response'
export async function sendVerificationEmail(
  email: string,
  verificationCode: string
): Promise<{ success: boolean; error?: any; response?: any }> {
  // Add response to return type
  try {
    const data = {
      from: process.env.MAILGUN_FROM_EMAIL || "noreply@lumixdigital.com.au",
      to: email,
      subject: "Verify your Lumix Digital account",
      text: `Your verification code is: ${verificationCode}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f9f9f9;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <tr>
              <td style="background-color: #000000; text-align: center; padding: 20px 0;">
                <img src="https://app.lumixdigital.com.au/public/image.png" alt="Lumix Digital" style="max-width: 180px; height: auto;">
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h1 style="color: #F58327; margin-top: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">Verify Your Email Address</h1>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">Hi there,</p>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">Thanks for signing up with Lumix Digital! To complete your registration and access our services, please enter the verification code below:</p>
                
                <div style="background-color: #f6f6f6; padding: 20px; border-radius: 6px; margin: 30px 0; text-align: center; border-left: 4px solid #F58327;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #F58327;">${verificationCode}</span>
                </div>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;"><strong>This code will expire in 10 minutes.</strong></p>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">If you didn't request this verification code, you can safely ignore this email.</p>
                
                <div style="margin-top: 40px;">
                  <p style="line-height: 1.6; font-size: 16px;">Thanks,<br>The Lumix Digital Team</p>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f2f2f2; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; font-size: 14px; color: #777; margin-bottom: 10px;">© ${new Date().getFullYear()} Lumix Digital. All rights reserved.</p>
                <p style="margin: 0; font-size: 14px; color: #777;">Should you have any questions or need assistance, our support team is here to help.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const result = await mg.messages.create(
      process.env.MAILGUN_DOMAIN || "",
      data
    );

    return { success: true, response: result };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
}

// Send questionnaire reminder email
export async function sendQuestionnaireReminderEmail(
  email: string,
  reminderNumber: number
): Promise<{ success: boolean; error?: any; response?: any }> {
  try {
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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background-color: #f9f9f9;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <tr>
              <td style="background-color: #000000; text-align: center; padding: 20px 0;">
                <img src="https://app.lumixdigital.com.au/public/image.png" alt="Lumix Digital" style="max-width: 180px; height: auto;">
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h1 style="color: #F58327; margin-top: 0; margin-bottom: 20px; font-size: 24px; text-align: center;">
                  ${
                    isFirstReminder
                      ? "Let's Build Your Website Together"
                      : "Don't Forget Your Website Questionnaire"
                  }
                </h1>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">Hello,</p>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">
                  ${
                    isFirstReminder
                      ? "Thanks for choosing Lumix Digital for your website project! To create a site that perfectly represents your brand and meets your business goals, we need to learn more about your vision and requirements."
                      : "We noticed you haven't completed your website questionnaire yet. Your input is essential for us to create your perfect website that truly represents your brand and business goals."
                  }
                </p>
                
                <div style="background-color: #f8f9fa; padding: 25px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #F58327;">
                  <h3 style="margin-top: 0; color: #333; font-size: 18px;">Why this questionnaire matters:</h3>
                  <ul style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 10px;">Helps us understand your business needs and target audience</li>
                    <li style="margin-bottom: 10px;">Captures your design preferences and branding requirements</li>
                    <li style="margin-bottom: 10px;">Ensures we include all the functionality you need</li>
                    <li style="margin-bottom: 0;">Allows us to start building your website faster</li>
                  </ul>
                </div>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">The questionnaire should take only 10-15 minutes to complete, and will greatly help us create a website that meets your expectations.</p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="https://app.lumixdigital.com.au/questionnaire" 
                    style="background-color: #F58327; color: white; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 5px rgba(245, 131, 39, 0.3);">
                    Complete Questionnaire Now
                  </a>
                </div>
                
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 16px;">If you have any questions or need assistance with the questionnaire, please don't hesitate to contact our support team.</p>
                
                <div style="margin-top: 40px;">
                  <p style="line-height: 1.6; font-size: 16px;">Thanks,<br>The Lumix Digital Team</p>
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f2f2f2; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; font-size: 14px; color: #777; margin-bottom: 10px;">© ${new Date().getFullYear()} Lumix Digital. All rights reserved.</p>
                <p style="margin: 0; font-size: 14px; color: #777;">Looking for more information? Visit our <a href="https://lumixdigital.com.au" style="color: #F58327; text-decoration: none;">website</a>.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const result = await mg.messages.create(
      process.env.MAILGUN_DOMAIN || "",
      data
    );

    return { success: true, response: result };
  } catch (error) {
    console.error("Error sending questionnaire reminder email:", error);
    return { success: false, error };
  }
}
