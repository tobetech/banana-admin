import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [memberCount, machineCounts, revenue, topMachines, dailyRevenue, monthlyRevenue, machineStatus] =
    await Promise.all([
      queryOne<{ count: number }>(`select count(*)::int as count from vending.members`),
      queryOne<{ total: number; online: number }>(`
        select count(*)::int as total,
          count(*) filter (where now() - last_seen < interval '10 minutes')::int as online
        from vending.machines
      `),
      queryOne<{ total: string; today: string; yesterday: string }>(`
        select
          coalesce(sum(amount) filter (where status = 'success'), 0)::text as total,
          coalesce(sum(amount) filter (where status = 'success' and created_at::date = current_date), 0)::text as today,
          coalesce(sum(amount) filter (where status = 'success' and created_at::date = current_date - 1), 0)::text as yesterday
        from vending.transactions
        where type = 'play'
      `),
      query<{ machine_id: string; revenue: string }>(`
        select machine_id, coalesce(sum(amount), 0)::text as revenue
        from vending.transactions
        where type = 'play' and status = 'success'
        group by machine_id
        order by sum(amount) desc
        limit 5
      `),
      query<{ day: string; revenue: string }>(`
        select to_char(d.day, 'DD Mon') as day, coalesce(sum(t.amount), 0)::text as revenue
        from generate_series(current_date - interval '13 days', current_date, interval '1 day') d(day)
        left join vending.transactions t
          on t.created_at::date = d.day and t.type = 'play' and t.status = 'success'
        group by d.day
        order by d.day
      `),
      query<{ month: string; revenue: string }>(`
        select to_char(m.month, 'Mon YYYY') as month, coalesce(sum(t.amount), 0)::text as revenue
        from generate_series(date_trunc('month', current_date) - interval '5 months', date_trunc('month', current_date), interval '1 month') m(month)
        left join vending.transactions t
          on date_trunc('month', t.created_at) = m.month and t.type = 'play' and t.status = 'success'
        group by m.month
        order by m.month
      `),
      query<{
        machine_id: string;
        location: string | null;
        ip_address: string | null;
        signal_strength: number | null;
        last_seen: string | null;
        status: string;
      }>(`
        select machine_id, location, ip_address, signal_strength, last_seen,
          case when now() - last_seen < interval '10 minutes' then 'online' else 'offline' end as status
        from vending.machines
        order by machine_id
      `),
    ]);

  return { memberCount, machineCounts, revenue, topMachines, dailyRevenue, monthlyRevenue, machineStatus };
}

export default async function DashboardPage() {
  const session = getSession();
  const { memberCount, machineCounts, revenue, topMachines, dailyRevenue, monthlyRevenue, machineStatus } =
    await getDashboardData();

  const maxTopRevenue = Math.max(1, ...topMachines.map((m) => Number(m.revenue)));

  return (
    <>
      <Topbar title="Dashboard" username={session?.username ?? "Admin"} role={session?.role} />
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="สมาชิกทั้งหมด" value={memberCount?.count ?? 0} valueColor="text-accent" />
          <StatCard
            label="เครื่อง Online"
            value={machineCounts?.online ?? 0}
            valueColor="text-accent2"
            sub={`จาก ${machineCounts?.total ?? 0} เครื่อง`}
          />
          <StatCard
            label="รายได้รวม"
            value={`฿${Number(revenue?.total ?? 0).toLocaleString()}`}
            valueColor="text-gold"
          />
          <StatCard
            label="วันนี้"
            value={Number(revenue?.today ?? 0).toLocaleString()}
            valueColor="text-danger"
            sub={`เมื่อวาน ${Number(revenue?.yesterday ?? 0).toLocaleString()}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <RevenueChart
              daily={dailyRevenue.map((d) => ({ label: d.day, revenue: Number(d.revenue) }))}
              monthly={monthlyRevenue.map((m) => ({ label: m.month, revenue: Number(m.revenue) }))}
            />
          </div>

          {/* Top 5 machines */}
          <div className="bg-panel border border-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Top 5 เครื่อง</h3>
            <div className="space-y-4">
              {topMachines.length === 0 && <p className="text-muted text-sm">ยังไม่มีข้อมูล</p>}
              {topMachines.map((m, i) => (
                <div key={m.machine_id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-200">
                      {i + 1}. {m.machine_id}
                    </span>
                    <span className="text-gold font-medium">฿{Number(m.revenue).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(Number(m.revenue) / maxTopRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Machine status table */}
        <div className="bg-panel border border-border rounded-2xl overflow-hidden">
          <h3 className="text-white font-semibold px-5 pt-5 pb-3">สถานะเครื่อง</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-left border-t border-border">
                  <th className="px-5 py-3 font-normal">Machine ID</th>
                  <th className="px-5 py-3 font-normal">สถานะ</th>
                  <th className="px-5 py-3 font-normal">IP</th>
                  <th className="px-5 py-3 font-normal">Signal</th>
                  <th className="px-5 py-3 font-normal">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {machineStatus.map((m) => (
                  <tr key={m.machine_id} className="border-t border-border hover:bg-panel2/50">
                    <td className="px-5 py-3 text-white font-medium">{m.machine_id}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                          m.status === "online"
                            ? "bg-accent2/15 text-accent2"
                            : "bg-danger/15 text-danger"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            m.status === "online" ? "bg-accent2" : "bg-danger"
                          }`}
                        />
                        {m.status === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">{m.ip_address ?? "-"}</td>
                    <td className="px-5 py-3 text-gray-300">
                      {m.signal_strength !== null ? `${m.signal_strength} dBm` : "-"}
                    </td>
                    <td className="px-5 py-3 text-muted">{relativeTime(m.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return "ไม่เคยเชื่อมต่อ";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} วันที่แล้ว`;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours > 0) return `${hours} ชม.ที่แล้ว`;
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins > 0) return `${mins} นาทีที่แล้ว`;
  return "เมื่อสักครู่";
}
