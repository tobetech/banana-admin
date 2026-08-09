import { query, queryOne } from "@/lib/db";

export type MonthlySummary = {
  play_revenue: string;
  topup_total: string;
  refund_total: string;
  play_count: string;
};

export type MachineRow = { machine_id: string; plays: string; revenue: string };
export type DayRow = { day: string; label: string; plays: string; revenue: string };

// รับ month แบบ "YYYY-MM" คืนช่วงต้น/ท้ายเดือน + ข้อมูลรายงานทั้งหมด
export async function getMonthlyReport(monthStr: string) {
  const monthStart = `${monthStr}-01`;

  const [summary, byMachine, byDay] = await Promise.all([
    queryOne<MonthlySummary>(
      `select
         coalesce(sum(amount) filter (where type = 'play' and status = 'success'), 0)::text as play_revenue,
         coalesce(sum(amount) filter (where type = 'topup' and status = 'success'), 0)::text as topup_total,
         coalesce(sum(amount) filter (where type = 'refund' and status = 'success'), 0)::text as refund_total,
         count(*) filter (where type = 'play' and status = 'success')::text as play_count
       from vending.transactions
       where created_at >= $1::date and created_at < ($1::date + interval '1 month')`,
      [monthStart]
    ),
    query<MachineRow>(
      `select machine_id, count(*)::text as plays, coalesce(sum(amount), 0)::text as revenue
       from vending.transactions
       where type = 'play' and status = 'success'
         and created_at >= $1::date and created_at < ($1::date + interval '1 month')
       group by machine_id
       order by sum(amount) desc`,
      [monthStart]
    ),
    query<DayRow>(
      `select to_char(d.day, 'DD') as day, to_char(d.day, 'DD Mon') as label,
              count(t.id) filter (where t.type = 'play' and t.status = 'success')::text as plays,
              coalesce(sum(t.amount) filter (where t.type = 'play' and t.status = 'success'), 0)::text as revenue
       from generate_series($1::date, ($1::date + interval '1 month' - interval '1 day'), interval '1 day') d(day)
       left join vending.transactions t on t.created_at::date = d.day
       group by d.day
       order by d.day`,
      [monthStart]
    ),
  ]);

  return {
    monthStart,
    summary: summary ?? { play_revenue: "0", topup_total: "0", refund_total: "0", play_count: "0" },
    byMachine,
    byDay,
  };
}

export function lastNMonths(n: number): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("th-TH", { year: "numeric", month: "long" });
    months.push({ value, label });
  }
  return months;
}
