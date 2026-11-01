# Handoff — สารบัญ

บันทึกส่งต่องานระหว่าง session / คน — ส่วนที่เป็น**สถานะและบทเรียน** ของระบบ
(spec ที่เป็นทางการอยู่ในหน้า HTML: `srs-p*.html`, `api-workflow-guide.html`, `backend-convention.html`)

ชื่อไฟล์ไม่เปลี่ยนตอนย้ายเข้าโฟลเดอร์ — โค้ดและเอกสารอ้างถึงไฟล์เหล่านี้ด้วยชื่อเปล่า ๆ
(เช่น `HANDOFF-Document-Print-Pipeline.md §3`) ค้นด้วยชื่อไฟล์ได้เสมอ: `find docs/plan-erp/handoff -name 'HANDOFF-*'`

## อ่านก่อน

| ไฟล์ | คืออะไร |
|---|---|
| [`HANDOFF-Feature.md`](HANDOFF-Feature.md) | **log หลัก** — อะไร ship แล้ว อะไรพัง และกับดักที่เคยเจอ (§4 อ่านก่อน debug ทุกครั้ง) · §2 งานค้างเรียงตามลำดับ |

## `features/` — แผน / สถานะของฟีเจอร์ใหญ่

| ไฟล์ | เรื่อง |
|---|---|
| [`HANDOFF-Backlog-Reporting-Print-Tax.md`](features/HANDOFF-Backlog-Reporting-Print-Tax.md) | พิมพ์เอกสารจริง · P6 Reporting · ภ.พ.30 · หนังสือหัก ณ ที่จ่าย |
| [`HANDOFF-Document-Print-Pipeline.md`](features/HANDOFF-Document-Print-Pipeline.md) | Document Print Pipeline (ออกแบบ + แผนงาน) |
| [`HANDOFF-Configurable-Chart-Of-Accounts.md`](features/HANDOFF-Configurable-Chart-Of-Accounts.md) | ผังบัญชีที่ลูกค้าแก้ไขเองได้ |
| [`HANDOFF-Financial-Statements.md`](features/HANDOFF-Financial-Statements.md) | งบการเงิน — งบดุล / งบกำไรขาดทุน |
| [`HANDOFF-Fiscal-Year-Closing.md`](features/HANDOFF-Fiscal-Year-Closing.md) | ปิดปีบัญชี + ยอดยกมา |

## `infra/` — โครงสร้างพื้นฐาน / ฐานข้อมูล

| ไฟล์ | เรื่อง |
|---|---|
| [`HANDOFF-Infra-Durability-Replication.md`](infra/HANDOFF-Infra-Durability-Replication.md) | ข้อมูลที่บันทึกแล้วหายได้ · อ่านได้ข้อมูลเก่า (replication) |
| [`HANDOFF-Postgresql.md`](infra/HANDOFF-Postgresql.md) | PostgreSQL / Pgpool — สิ่งที่ยังไม่ได้ทดสอบ |

## `reviews/` — ผลรีวิว branch / PR ของ contributor

เขียนโดย skill `review-branch` (ผู้รีวิวแก้ให้) หรือ `review-pr` (ผู้เขียนแก้เอง) · ชื่อไฟล์ `HANDOFF-<topic>-review.md`

| ไฟล์ | วันที่ | ขอบเขต |
|---|---|---|
| [`HANDOFF-purchase-discount-document-review.md`](reviews/HANDOFF-purchase-discount-document-review.md) | 2026-10-23 | `feature/purchase-discound-document` |
| [`HANDOFF-product-suspend-sales-review.md`](reviews/HANDOFF-product-suspend-sales-review.md) | 2026-10-26 | `feature/product`, `feature/suspend-sales`, `feature/optional-cus-supplier` |
| [`HANDOFF-pos-optional-customer-review.md`](reviews/HANDOFF-pos-optional-customer-review.md) | 2026-11-01 | PR #5 `feature/sales-optional-custumer` |

## `sessions/` — สรุปท้าย session (ลงวันที่)

| ไฟล์ | เรื่อง |
|---|---|
| [`HANDOFF-Next-Steps-2026-10-26.md`](sessions/HANDOFF-Next-Steps-2026-10-26.md) | งานที่ต้องทำต่อหลังรอบ 2026-10-26 |

## เพิ่มไฟล์ใหม่

- ฟีเจอร์ใหญ่ที่ต้องวางแผนหลายรอบ → `features/HANDOFF-<Feature-Name>.md`
- infra / DB / deploy → `infra/`
- ผลรีวิว → `reviews/HANDOFF-<topic>-review.md`
- สรุปท้าย session → `sessions/HANDOFF-Next-Steps-<YYYY-MM-DD>.md`
- เพิ่มแถวในตารางของไฟล์นี้ทุกครั้ง · ชื่อไฟล์ต้องไม่ซ้ำกันทั้งโฟลเดอร์ (การอ้างแบบชื่อเปล่าต้องชี้ได้ไฟล์เดียว)
- ห้ามมีโดเมน / IP / credential จริงของลูกค้า (repo นี้ public — ดู `../CLAUDE.md`)
