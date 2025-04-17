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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://lumixdigital.com.au/images/logo.png" alt="Lumix Digital" style="max-width: 150px;" />
          </div>
          <h2 style="color: #F58327; text-align: center;">Verify Your Email Address</h2>
          <p>Thanks for signing up with Lumix Digital! To complete your registration, please enter the verification code below:</p>
          <div style="background-color: #f6f6f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #F58327;">${verificationCode}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account with Lumix Digital, you can safely ignore this email.</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} Lumix Digital. All rights reserved.</p>
          </div>
        </div>
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
