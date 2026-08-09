export default function StatCard({
  label,
  value,
  valueColor = "text-white",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="bg-panel border border-border rounded-2xl p-5">
      <p className="text-muted text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${valueColor}`}>{value}</p>
      {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}
