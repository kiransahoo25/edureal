import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendBookingConfirmationEmail,
  sendTeacherNewBookingEmail,
} from "@/lib/email/send";

// 1. Define the exact type matching our Supabase query
type BookingWithRelations = {
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
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

export async function POST(request: Request) {
  try {
    const { bookingId, type } = await request.json();
    if (!bookingId || !type)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const supabase = await createClient();

    const { data: rawBooking, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        availability (date, start_time, end_time),
        teacher_profiles (user_id, profiles (full_name, email)),
        student:profiles!bookings_student_id_fkey (full_name, email, id)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (error || !rawBooking)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 2. Cast the raw booking to our strict type instead of using 'any'
    const booking = rawBooking as unknown as BookingWithRelations;

    const teacher = booking.teacher_profiles;
    const student = booking.student;
    const date = booking.availability?.date || "";

    if (type === "new") {
      // Notify Teacher
      if (teacher?.profiles?.email) {
        await sendTeacherNewBookingEmail({
          to: teacher.profiles.email,
          teacherName: teacher.profiles.full_name || "Teacher",
          studentName: student?.full_name || "Student",
          date,
          startTime: booking.availability?.start_time?.slice(0, 5) || "",
          endTime: booking.availability?.end_time?.slice(0, 5) || "",
          amount: booking.amount,
          bookingId: booking.id,
        });
      }

      // Save Notification to DB for Teacher
      if (teacher?.user_id) {
        await supabase.from("notifications").insert({
          user_id: teacher.user_id,
          title: "New Booking Request",
          message: `${student?.full_name || "A student"} requested a session on ${date}.`,
          link: "/dashboard/bookings",
        });
      }
    } else if (type === "confirmed") {
      // Notify Student
      if (student?.email) {
        await sendBookingConfirmationEmail({
          to: student.email,
          studentName: student.full_name || "Student",
          teacherName: teacher?.profiles?.full_name || "Teacher",
          date,
          startTime: booking.availability?.start_time?.slice(0, 5) || "",
          endTime: booking.availability?.end_time?.slice(0, 5) || "",
          amount: booking.amount,
          bookingId: booking.id,
        });
      }

      // Save Notification to DB for Student
      if (student?.id) {
        await supabase.from("notifications").insert({
          user_id: student.id,
          title: "Booking Confirmed!",
          message: `Your session with ${teacher?.profiles?.full_name || "your teacher"} is confirmed.`,
          link: "/dashboard/bookings",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notification route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
