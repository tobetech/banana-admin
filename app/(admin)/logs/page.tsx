import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  login: "เข้าสู่ระบบ",
  member_register: "ลงทะเบียนสมาชิกใหม่",
  member_topup: "เติมเงินสมาชิก",
  member_refund: "คืนเครดิตเข้าบัตร",
  member_cancel: "ยกเลิกบัตรสมาชิก",
  member_reactivate: "เปิดใช้งานบัตรสมาชิก",
  machine_create: "เพิ่มเครื่องใหม่",
  machine_update: "แก้ไขข้อมูลเครื่อง",
};

const ACTION_COLOR: Record<string, string> = {
  login: "bg-panel2 text-muted",
  member_register: "bg-accent/15 text-accent",
  member_topup: "bg-accent2/15 text-accent2",
  member_refund: "bg-accent2/15 text-accent2",
  member_cancel: "bg-danger/15 text-danger",
  member_reactivate: "bg-accent2/15 text-accent2",
  machine_create: "bg-accent/15 text-accent",
  machine_update: "bg-panel2 text-gray-300",
};

function summarizeDetail(action: string, detail: any): string {
  if (!detail) return "-";
  switch (action) {
    case "member_topup":
      return `${detail.member_name ?? detail.member_id} +฿${detail.amount}`;
    case "member_refund":
      return `${detail.member_name ?? detail.rfid_uid} +฿${detail.amount} (คืนเครดิต)`;
    case "member_register":
      return `${detail.name} (${detail.rfid_uid})`;
    case "member_cancel":
    case "member_reactivate":
      return detail.member_name ?? detail.member_id;
    case "machine_create":
      return `${detail.machine_id} @ ${detail.location} ฿${detail.price}`;
    case "machine_update":
      return detail.machine_id;
    default:
      return "";
  }
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { action?: string };
}) {
  const session = getSession();
  const actionFilter = searchParams.action;

  const logs = await query<any>(
    `select id, username, action, detail, ip_address, created_at
     from vending.admin_logs
     ${actionFilter ? "where action = $1" : ""}
     order by created_at desc
     limit 300`,
    actionFilter ? [actionFilter] : []
  );

  const filters = [
    { value: undefined, label: "ทั้งหมด" },
    { value: "login", label: "เข้าสู่ระบบ" },
    { value: "member_register", label: "ลงทะเบียน" },
    { value: "member_topup", label: "เติมเงิน" },
    { value: "member_refund", label: "คืนเครดิต" },
    { value: "member_cancel", label: "ยกเลิกบัตร" },
    { value: "machine_create", label: "เพิ่มเครื่อง" },
    { value: "machine_update", label: "แก้ไขเครื่อง" },
  ];

  return (
    <>
      <Topbar title="Log Admin" username={session?.username ?? "Admin"} role={session?.role} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <a
              key={f.label}
              href={f.value ? `/logs?action=${f.value}` : "/logs"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                actionFilter === f.value ? "bg-accent text-gray-900" : "bg-panel2 text-muted hover:text-white"
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
                  <th className="px-5 py-3 font-normal">ผู้ใช้</th>
                  <th className="px-5 py-3 font-normal">การกระทำ</th>
                  <th className="px-5 py-3 font-normal">รายละเอียด</th>
                  <th className="px-5 py-3 font-normal">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border hover:bg-panel2/50">
                    <td className="px-5 py-3 text-muted text-xs whitespace-nowrap">
                     {new Date(l.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                    </td>
                    <td className="px-5 py-3 text-white">
                      {l.username === "kiosk" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-[10px] bg-panel2 text-muted px-1.5 py-0.5 rounded">kiosk</span>
                        </span>
                      ) : (
                        l.username
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${ACTION_COLOR[l.action] ?? "bg-panel2 text-gray-300"}`}>
                        {ACTION_LABEL[l.action] ?? l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-xs">{summarizeDetail(l.action, l.detail)}</td>
                    <td className="px-5 py-3 text-muted text-xs">{l.ip_address ?? "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted">
                      ยังไม่มี log
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
