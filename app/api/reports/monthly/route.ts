import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMonthlyReport } from "@/lib/reports";

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(values: (string | number)[]): string {
  return values.map(escapeCsv).join(",") + "\r\n";
}

export async function GET(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }

  const { summary, byMachine, byDay } = await getMonthlyReport(month);

  let csv = "\uFEFF"; // BOM กันภาษาไทยเพี้ยนตอนเปิดด้วย Excel
  csv += `รายงานรายเดือน,${month}\r\n\r\n`;
  csv += "สรุป\r\n";
  csv += toCsvRow(["รายได้จากการเล่น (บาท)", summary.play_revenue]);
  csv += toCsvRow(["จำนวนครั้งที่เล่น", summary.play_count]);
  csv += toCsvRow(["ยอดเติมเงินรวม (บาท)", summary.topup_total]);
  csv += toCsvRow(["ยอดคืนเงินรวม (บาท)", summary.refund_total]);
  csv += "\r\n";

  csv += "แยกตามวัน\r\n";
  csv += toCsvRow(["วันที่", "จำนวนครั้งที่เล่น", "รายได้ (บาท)"]);
  for (const d of byDay) {
    csv += toCsvRow([d.label, d.plays, d.revenue]);
  }
  csv += "\r\n";

  csv += "แยกตามเครื่อง\r\n";
  csv += toCsvRow(["Machine ID", "จำนวนครั้งที่เล่น", "รายได้ (บาท)"]);
  for (const m of byMachine) {
    csv += toCsvRow([m.machine_id, m.plays, m.revenue]);
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-report-${month}.csv"`,
    },
  });
}
