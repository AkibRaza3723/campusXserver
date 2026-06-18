import sgMail from "@sendgrid/mail";


sgMail.setApiKey( process.env.SENDGRID_API_KEY);

export async function sendEmail({ to, subject, text, html }) {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text,
    html: html || text,
  });
}