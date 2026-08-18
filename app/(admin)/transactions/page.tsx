import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  play: "เล่น",
  topup: "เติมเงิน",
  refund: "คืนเงิน",
};

const TYPE_COLOR: Record<string, string> = {
  play: "bg-accent/15 text-accent",
  topup: "bg-accent2/15 text-accent2",
  refund: "bg-gold/15 text-gold",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const session = getSession();
  const typeFilter = searchParams.type;

  const rows = await query<any>(
    `select t.id, t.amount::text as amount, t.credit_before::text as credit_before,
            t.credit_after::text as credit_after, t.type, t.status, t.machine_id, t.created_at,
            m.name as member_name
     from vending.transactions t
     left join vending.members m on m.id = t.member_id
     ${typeFilter ? "where t.type = $1" : ""}
     order by t.created_at desc
     limit 200`,
    typeFilter ? [typeFilter] : []
  );

  return (
    <>
      <Topbar title="ธุรกรรม" username={session?.username ?? "Admin"} role={session?.role} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          {[
            { value: undefined, label: "ทั้งหมด" },
            { value: "play", label: "เล่น" },
            { value: "topup", label: "เติมเงิน" },
            { value: "refund", label: "คืนเงิน" },
          ].map((f) => (
            <a
              key={f.label}
              href={f.value ? `/transactions?type=${f.value}` : "/transactions"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                typeFilter === f.value
                  ? "bg-accent text-gray-900"
                  : "bg-panel2 text-muted hover:text-white"
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>

        <div className="bg-panel border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-left">
                  <th className="px-5 py-3 font-normal">เวลา</th>
                  <th className="px-5 py-3 font-normal">สมาชิก</th>
                  <th className="px-5 py-3 font-normal">เครื่อง</th>
                  <th className="px-5 py-3 font-normal">ประเภท</th>
                  <th className="px-5 py-3 font-normal text-right">จำนวนเงิน</th>
                  <th className="px-5 py-3 font-normal text-right">เครดิตก่อน → หลัง</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-panel2/50">
                    <td className="px-5 py-3 text-muted text-xs">
                      {new Date(r.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                    </td>
                    <td className="px-5 py-3 text-white">{r.member_name ?? "-"}</td>
                    <td className="px-5 py-3 text-gray-300">{r.machine_id ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${TYPE_COLOR[r.type] ?? ""}`}>
                        {TYPE_LABEL[r.type] ?? r.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gold font-medium">
                      ฿{Number(r.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-muted text-xs">
                      {r.credit_before !== null ? Number(r.credit_before).toLocaleString() : "-"} → {" "}
                      {r.credit_after !== null ? Number(r.credit_after).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted">
                      ยังไม่มีรายการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
