import Header from "@/components/Header";
import ContactUsClient from "./ContactUsClient";

export const metadata = {
  title: "Contact Us - JobDaddy AI ATS & Recruitment",
  description: "Get in touch with JobDaddy. Have questions about our recruitment platform, ATS, or career services? Drop us a line.",
};

export default function ContactUsPage() {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-slate-50/50 selection:bg-blue-600/20">
      <Header />
      <ContactUsClient />
    </div>
  );
}
