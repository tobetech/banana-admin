import { getSession } from "@/lib/auth";
import { getMonthlyReport, lastNMonths } from "@/lib/reports";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";

export const dynamic = "force-dynamic";

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = getSession();
  const month = searchParams.month || currentMonthValue();
  const { summary, byMachine, byDay } = await getMonthlyReport(month);

  const monthOptions = lastNMonths(12);
  const net =
    Number(summary.play_revenue) + Number(summary.topup_total) - Number(summary.refund_total);
  const maxDayRevenue = Math.max(1, ...byDay.map((d) => Number(d.revenue)));

  return (
    <>
      <Topbar title="รายงานรายเดือน" username={session?.username ?? "Admin"} role={session?.role} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <form method="GET" className="flex items-center gap-2">
            <select name="month" defaultValue={month} className="input w-auto">
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-4">
              ดูรายงาน
            </button>
          </form>

          <a
            href={`/api/reports/monthly?month=${month}`}
            className="bg-panel2 hover:bg-border border border-border text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            ⬇ Export CSV
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="รายได้จากการเล่น"
            value={`฿${Number(summary.play_revenue).toLocaleString()}`}
            valueColor="text-gold"
            sub={`${Number(summary.play_count).toLocaleString()} ครั้ง`}
          />
          <StatCard
            label="ยอดเติมเงินรวม"
            value={`฿${Number(summary.topup_total).toLocaleString()}`}
            valueColor="text-accent2"
          />
          <StatCard
            label="ยอดคืนเงินรวม"
            value={`฿${Number(summary.refund_total).toLocaleString()}`}
            valueColor="text-danger"
          />
          <StatCard
            label="สุทธิ (เติม + เล่น - คืน)"
            value={`฿${net.toLocaleString()}`}
            valueColor="text-accent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* รายวันในเดือนนี้ */}
          <div className="lg:col-span-2 bg-panel border border-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">รายได้รายวัน</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {byDay.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="text-muted text-xs w-16 shrink-0">{d.label}</span>
                  <div className="flex-1 h-2 bg-panel2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(Number(d.revenue) / maxDayRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-gold text-xs w-20 text-right shrink-0">
                    ฿{Number(d.revenue).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* แยกตามเครื่อง */}
          <div className="bg-panel border border-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">แยกตามเครื่อง</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {byMachine.length === 0 && <p className="text-muted text-sm">ไม่มีข้อมูลเดือนนี้</p>}
              {byMachine.map((m) => (
                <div key={m.machine_id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-white">{m.machine_id}</p>
                    <p className="text-muted text-xs">{m.plays} ครั้ง</p>
                  </div>
                  <span className="text-gold font-medium">฿{Number(m.revenue).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
