import { NextResponse } from "next/server";
import { sendBookingConfirmationEmail } from "@/lib/email/send";

export async function GET() {
  const result = await sendBookingConfirmationEmail({
    to: "kirankumarsahoo998@gmail.com", // ← CHANGE THIS to your real email
    studentName: "Test Student",
    teacherName: "Test Teacher",
    date: "2026-10-20",
    startTime: "10:00",
    endTime: "11:00",
    amount: 500,
    bookingId: "test-booking-1234567890",
  });

  return NextResponse.json(result);
}
