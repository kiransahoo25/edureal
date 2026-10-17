import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendBookingConfirmationEmail,
  sendTeacherNewBookingEmail,
} from "@/lib/email/send";

type BookingRow = {
  id: string;
  amount: number;
  availability: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  teacher_profiles: {
    user_id: string;
    profiles: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
  student: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export async function POST(request: Request) {
  try {
    const { bookingId, type } = await request.json();

    if (!bookingId || !type) {
      return NextResponse.json(
        { error: "Missing bookingId or type" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Fetch booking with teacher + student details
    const { data: rawBooking, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        availability (date, start_time, end_time),
        teacher_profiles (
          user_id,
          profiles (full_name, email)
        ),
        student:profiles!bookings_student_id_fkey (full_name, email)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (error || !rawBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = rawBooking as unknown as BookingRow;

    const teacher = booking.teacher_profiles;
    const student = booking.student;
    const date = booking.availability?.date || "";
    const startTime = booking.availability?.start_time?.slice(0, 5) || "";
    const endTime = booking.availability?.end_time?.slice(0, 5) || "";

    if (type === "new") {
      if (teacher?.profiles?.email) {
        await sendTeacherNewBookingEmail({
          to: teacher.profiles.email,
          teacherName: teacher.profiles.full_name || "Teacher",
          studentName: student?.full_name || "Student",
          date,
          startTime,
          endTime,
          amount: booking.amount,
          bookingId: booking.id,
        });
      }
    } else if (type === "confirmed") {
      if (student?.email) {
        await sendBookingConfirmationEmail({
          to: student.email,
          studentName: student.full_name || "Student",
          teacherName: teacher?.profiles?.full_name || "Teacher",
          date,
          startTime,
          endTime,
          amount: booking.amount,
          bookingId: booking.id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notify booking error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
