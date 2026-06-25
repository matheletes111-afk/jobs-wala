import Header from "@/components/Header";
import CareerServicesClient from "./CareerServicesClient";

export const metadata = {
  title: "Career Services - JobDaddy AI ATS & Professional Profile Optimization",
  description: "Develop your ATS-friendly resume, optimize your LinkedIn profile, practice mock interviews, and receive guaranteed hiring assistance with JobDaddy's career experts.",
};

export default function CareerServicesPage() {
  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-slate-50">
      <Header />
      <CareerServicesClient />
    </div>
  );
}
