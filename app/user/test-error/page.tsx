"use client";

export default function TestErrorPage() {
  throw new Error("Test error for error boundary");
}
