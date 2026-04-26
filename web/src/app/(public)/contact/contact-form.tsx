"use client";

import { useState } from "react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Simulate sending — replace with real API call if needed
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
    } catch {
      setError("Failed to send message. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Message Sent!</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Thank you for reaching out. We&apos;ll get back to you within 24–48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[var(--danger-light)] border border-red-200 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="Juan Dela Cruz"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="juan@example.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium text-[var(--text-primary)] mb-1">Subject</label>
        <select
          id="contact-subject"
          name="subject"
          required
          value={form.subject}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:outline-none bg-[var(--surface)]"
        >
          <option value="">Select a subject…</option>
          <option value="Application Inquiry">Application Inquiry</option>
          <option value="Document Requirements">Document Requirements</option>
          <option value="Claiming Appointment">Claiming Appointment</option>
          <option value="Technical Issue">Technical Issue</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message</label>
        <textarea
          name="message"
          rows={5}
          required
          value={form.message}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:outline-none resize-none"
          placeholder="How can we help you?"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto bg-[var(--accent)] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
