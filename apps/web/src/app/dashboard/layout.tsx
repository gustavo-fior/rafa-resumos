import DashboardNav from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-8 pt-6 md:px-0">
      <DashboardNav />
      {children}
    </div>
  );
}
