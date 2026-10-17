import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type BookingEmailProps = {
  to: string;
  studentName: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  bookingId: string;
};

export async function sendBookingConfirmationEmail({
  to,
  studentName,
  teacherName,
  date,
  startTime,
  endTime,
  amount,
  bookingId,
}: BookingEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: "EduReal <onboarding@resend.dev>",
      to,
      subject: `Booking Request Sent to ${teacherName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">EduReal</h1>
          <h2>Hi ${studentName}, your booking request has been sent!</h2>
          <p>Your request to book a session with <strong>${teacherName}</strong> has been received. The teacher will confirm shortly.</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 4px 0;"><strong>🕐 Time:</strong> ${startTime} - ${endTime}</p>
            <p style="margin: 4px 0;"><strong>💰 Amount:</strong> ₹${amount}</p>
            <p style="margin: 4px 0;"><strong>🆔 Booking ID:</strong> ${bookingId.slice(0, 8)}</p>
          </div>
          
          <p>You'll get another email once the teacher confirms.</p>
          <p>— Team EduReal</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err };
  }
}

export async function sendTeacherNewBookingEmail({
  to,
  teacherName,
  studentName,
  date,
  startTime,
  endTime,
  amount,
  bookingId,
}: BookingEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: "EduReal <onboarding@resend.dev>",
      to,
      subject: `New Booking Request from ${studentName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">EduReal</h1>
          <h2>Hi ${teacherName}, you have a new booking request!</h2>
          <p><strong>${studentName}</strong> wants to book a session with you.</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${date}</p>
            <p style="margin: 4px 0;"><strong>🕐 Time:</strong> ${startTime} - ${endTime}</p>
            <p style="margin: 4px 0;"><strong>💰 Amount:</strong> ₹${amount}</p>
            <p style="margin: 4px 0;"><strong>🆔 Booking ID:</strong> ${bookingId.slice(0, 8)}</p>
          </div>
          
          <p>Log in to your EduReal dashboard to confirm or decline the booking.</p>
          <p>— Team EduReal</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: err };
  }
}
