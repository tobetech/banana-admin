export default function Topbar({
  title,
  username,
  role,
}: {
  title: string;
  username: string;
  role?: "admin" | "super_admin";
}) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-bg/80 backdrop-blur sticky top-0 z-10">
      <h2 className="text-white font-semibold text-lg">{title}</h2>
      <div className="flex items-center gap-2">
        <span className="text-gray-300 text-xs hidden sm:inline">{username}</span>
        <span className="bg-accent text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full">
          {role === "super_admin" ? "Super Admin" : "Admin"}
        </span>
      </div>
    </header>
  );
}
