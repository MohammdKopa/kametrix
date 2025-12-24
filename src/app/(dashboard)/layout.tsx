export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Dashboard shell will be added later */}
      {children}
    </div>
  );
}
