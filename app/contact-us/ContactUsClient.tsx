"use client";

import React, { useState } from "react";
import { 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  Send, 
  CheckCircle2, 
  Sparkles,
  Globe,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactUsClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    subject: "Career Services",
    message: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    mobile: false,
    message: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateField = (name: keyof typeof errors, value: string) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Name is required.";
        } else if (value.trim().length < 3) {
          error = "Name must be at least 3 characters long.";
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = "Name can only contain letters and spaces.";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email address is required.";
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          error = "Please enter a valid email address.";
        }
        break;
      case "mobile": {
        const digitCount = value.replace(/[^0-9]/g, "").length;
        if (!value.trim()) {
          error = "Mobile number is required.";
        } else if (!/^\+?[0-9\s\-\(\)]+$/.test(value)) {
          error = "Invalid characters in phone number.";
        } else if (digitCount < 10) {
          error = "Phone number must contain at least 10 digits.";
        } else if (digitCount > 15) {
          error = "Phone number must not exceed 15 digits.";
        }
        break;
      }
      case "message":
        if (!value.trim()) {
          error = "Message is required.";
        } else if (value.trim().length < 10) {
          error = "Message must be at least 10 characters long.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field !== "subject") {
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields on submit attempt
    const allTouched = { name: true, email: true, mobile: true, message: true };
    setTouched(allTouched);

    const nameError = validateField("name", formData.name);
    const emailError = validateField("email", formData.email);
    const mobileError = validateField("mobile", formData.mobile);
    const messageError = validateField("message", formData.message);

    const newErrors = {
      name: nameError,
      email: emailError,
      mobile: mobileError,
      message: messageError,
    };
    setErrors(newErrors);

    if (nameError || emailError || mobileError || messageError) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", mobile: "", subject: "Career Services", message: "" });
        setErrors({ name: "", email: "", mobile: "", message: "" });
        setTouched({ name: false, email: false, mobile: false, message: false });
      } else {
        const data = await res.json();
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send message. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 relative bg-transparent overflow-x-hidden">
      {/* Decorative background blobs */}
      <div className="absolute right-[8%] top-[10%] w-[450px] h-[450px] bg-blue-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute left-[-5%] top-[45%] w-[400px] h-[400px] bg-orange-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-12 text-center sm:px-6 md:px-8 lg:px-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4 border border-blue-200/60">
          <Sparkles className="size-3.5" />
          Support & Inquiry
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-4">
          Let's Start a <span className="text-blue-600">Conversation</span>
        </h1>
        <p className="text-base text-slate-650 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
          Have questions about our recruitment platform or need custom career assistance? Drop us a line and our founding team will get back to you within 2 hours.
        </p>
      </section>

      {/* Form and Contact Info Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-2">Contact Details</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Reach out to us directly or visit our headquarters. We are here to support your recruitment & job search goals.
                </p>
              </div>

              <div className="space-y-6">
                {/* Item: Address */}
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Our Headquarters</p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed mt-0.5">
                      Sector 12, Greater Noida, <br />Uttar Pradesh, India
                    </p>
                  </div>
                </div>

                {/* Item: Email */}
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Inquiry</p>
                    <a href="mailto:Info@jobdaddy.in" className="text-xs sm:text-sm font-extrabold text-slate-800 hover:text-blue-600 transition-colors block mt-0.5">
                      Info@jobdaddy.in
                    </a>
                  </div>
                </div>

                {/* Item: Timing */}
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Hours</p>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-relaxed mt-0.5">
                      Monday - Saturday <br />09:00 AM - 06:00 PM IST
                    </p>
                  </div>
                </div>

                {/* Item: Schedule Meeting via Calendly */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 shadow-sm flex flex-col gap-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Calendar className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Fast Track Meeting</p>
                      <h4 className="text-xs font-extrabold text-slate-900">Schedule 1-on-1 Candidate Call</h4>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                    Book an instant meeting directly with our team on Calendly.
                  </p>
                  <a
                    href="https://calendly.com/jobdaddy-info/jobdaddy-candidate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5" style={{ background: "#2563eb", color: "white" }}>
                      <span style={{ color: "white" }}>Book Slot on Calendly</span>
                      <ArrowRight className="size-3.5" style={{ stroke: "white" }} />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Serving Global Markets</span>
                </div>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">India · USA · UK · Gulf</span>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm relative">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-50 text-emerald-500 mb-2">
                    <CheckCircle2 className="size-10" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Message Sent Successfully!</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                    Thank you for contacting JobDaddy. Our team is already reviewing your details and will call or email you shortly.
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={() => setSubmitted(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                      Send Another Message
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        placeholder="e.g. Tarun Upadhyay"
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 font-semibold transition-all text-xs ${
                          touched.name && errors.name
                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                        }`}
                      />
                      {touched.name && errors.name && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        placeholder="e.g. info@jobdaddy.in"
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 font-semibold transition-all text-xs ${
                          touched.email && errors.email
                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                        }`}
                      />
                      {touched.email && errors.email && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Mobile */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Mobile Number</label>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange("mobile", e.target.value)}
                        onBlur={() => handleBlur("mobile")}
                        placeholder="e.g. +91 8800614884"
                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 font-semibold transition-all text-xs ${
                          touched.mobile && errors.mobile
                            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                            : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                        }`}
                      />
                      {touched.mobile && errors.mobile && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{errors.mobile}</p>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason for Contact</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold transition-all text-xs cursor-pointer"
                      >
                        <option value="Career Services">Career Services (Resume, Mock Drills)</option>
                        <option value="Enterprise ATS">Enterprise ATS & Products</option>
                        <option value="Executive Recruitment">Executive Search & Recruitment</option>
                        <option value="Other Support">General Support & Feedback</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Message</label>
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      onBlur={() => handleBlur("message")}
                      placeholder="Tell us how we can help you accelerate your recruitment or career growth..."
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 font-semibold transition-all text-xs resize-none ${
                        touched.message && errors.message
                          ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                          : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                    />
                    {touched.message && errors.message && (
                      <p className="text-[10px] text-red-500 font-bold mt-1">{errors.message}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 font-bold text-xs uppercase tracking-wider h-12 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="size-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing Request...
                        </>
                      ) : (
                        <>
                          Submit Inquiry <Send className="size-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
