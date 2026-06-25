import Header from "@/components/Header";
import FaqClient from "./FaqClient";

export const metadata = {
  title: "FAQ - JobDaddy AI ATS & Career Services",
  description: "Find answers to frequently asked questions about JobDaddy's AI-powered applicant tracking system (ATS), career counselling, resume enhancement, and hiring services.",
};

export default function FAQPage() {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-slate-50/50 selection:bg-blue-600/20">
      <Header />
      <FaqClient />
    </div>
  );
}
