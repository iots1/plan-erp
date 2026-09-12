# HANDOFF — Backlog: พิมพ์เอกสารจริง · P6 (Reporting) · ภ.พ.30 · หนังสือหัก ณ ที่จ่าย

> **เอกสาร backlog ของ product** — ไม่ใช่ session-tracking file แบบ `HANDOFF-Feature.md` — เก็บไว้ยาว
> จนกว่าจะหยิบมาทำจริง ลบทิ้งได้เฉพาะเมื่อทุกหัวข้อในนี้ปิดแล้ว (แต่ละหัวข้อ archive แยกไปที่ SRS/
> erp-architecture.html ตอนปิดงานจริง เหมือน pattern ที่ `HANDOFF-Feature.md` ทำกับงานที่เสร็จแล้ว)
>
> เขียนเมื่อ 2026-09-04 ระหว่างทำ "5 fixes แรก" (`stock_uom_id` immutable, password policy,
> `item.updated`, `stock.adjusted`, item group leaf) — พบว่า audit รอบนั้นมี 4 หัวข้อที่**ใหญ่เกินจะทำ
> ในรอบเดียว** จึงแยกมาบันทึกที่นี่แทนตามที่ผู้ใช้สั่ง
>
> **อัปเดต 2026-09-04 (รอบสอง)** — §4 ภ.พ.30 **v1 (คำนวณอย่างเดียว) implement แล้ว**
> (`GET /finance-bc/v1/vat-returns`) — ดู §4.3 · ที่เหลือ 3 หัวข้อ (§1 พิมพ์เอกสาร, §2 report-bc
> consumer, §3 P6, §5 หนังสือหัก ณ ที่จ่าย) ยังเป็น backlog เหมือนเดิม
>
> **อัปเดต 2026-09-05** — จากการ review เอกสารนี้หาช่องโหว่กฎหมาย/บัญชี: **§2 ข้อ 1 (dead-letter
> exchange) ทำแล้ว** (ดู `HANDOFF-Feature.md` § "2026-09-05 · Legal/Accounting Audit" ส่วน B1 +
> `rabbitmq-reliability-guide.html`) — แต่ต้นเหตุจริง (ไม่มี consumer) ยังไม่แก้ ยังต้องรอ §3 P6 ·
> **§4.4 ข้อ 1 (แยกใบกำกับเต็มรูป/อย่างย่อ) ทำแล้ว** ดู §4.4 ด้านล่าง ·
> **§3 P6 ครบ 4/4 read model แล้ว** (`profit_by_lot`, `expiry_alerts`, `low_stock`, `sales_summary` —
> ดู §3.4/§3.5) implement + migrate + deploy ผ่านหมด, `sales_summary` E2E บน production ผ่าน —
> ที่เหลือ (§1, §3 FE 120 ชม., §3 low_stock/expiry_alerts รอ cron ยืนยัน, §5, §4.4
> ข้อ 2–3) ยังเป็น backlog เหมือนเดิม
>
> **อัปเดต 2026-09-08 (audit doc drift)** — **§1 ไม่ใช่ backlog แล้ว**: print pipeline P0+P1+P2
> ขึ้นโปรดักชันครบ (`company_profiles`, `document_prints` + `report.printDocument` RPC,
> `POST /quotations/:id/print` + `POST /receipts/:id/print`) — **พิมพ์เอกสารครบวงจรได้จริงแล้ว 2 ใบ**
> เหลือ P3–P5 ที่ติดตามใน `HANDOFF-Document-Print-Pipeline.md` §7 (เอกสารนั้นเป็นเจ้าของสถานะเรื่องนี้
> แล้ว ไม่ใช่ §1 ที่นี่) · **§2 ต้นเหตุจริงปิดไปแล้วด้วย** — "ไม่มี consumer" หมดไปตอน §3 P6 ครบ 4/4
> · ที่เหลือจริงในไฟล์นี้: **§3 FE (120 ชม.)** · **§4.4 ข้อ 2–4** · **§5 หนังสือหัก ณ ที่จ่าย**
> (ยังติด `ap_invoices.supplier_tax_id` ที่ยังไม่มีในโค้ด — ยืนยันแล้ว 2026-09-08 · แต่ช่องว่าง
> "ข้อมูลบริษัทผู้ออก" ปิดแล้วด้วย `company_profiles` จาก print P0)

## 0 · สรุปสั้น — ทำไมแยกเป็น backlog แทนที่จะทำเลย

| หัวข้อ | สถานะ | ขนาดคร่าว ๆ |
|---|---|---|
| §1 พิมพ์เอกสารจริงไม่ได้เลยสักใบ | ✅ **ปิดหัวข้อนี้แล้ว 2026-09-06** — พิมพ์ได้จริง 2 ใบ (print pipeline P0+P1+P2 deploy แล้ว) · P3–P5 ที่เหลือย้ายไปติดตามที่ `HANDOFF-Document-Print-Pipeline.md` §7 | เหลือ P3 ≈ 1–2 วัน, P4 ≈ 0.5 วัน/ใบ |
| §2 report-bc consumer หาย (finding เกี่ยวเนื่อง) | ✅ **ปิดครบแล้ว** — ข้อ 1 (dead-letter exchange) 2026-09-05 · ต้นเหตุจริง (ไม่มี consumer) หมดไปตอน §3 P6 ครบ 4/4 (2026-09-05) | — |
| §3 P6 ทั้งเฟส (CQRS Read Model) | ✅ **4/4 read model ทำแล้ว + deploy แล้ว 2026-09-05** (`profit_by_lot`, `expiry_alerts`, `low_stock`, `sales_summary` — consumer+ตาราง+API ครบ) · `sales_summary` E2E บน production ผ่าน · `low_stock`/`expiry_alerts` รอ cron กลางคืนยืนยัน · FE ยังไม่แตะ | เหลือ: FE 120 ชม. |
| §4 ภ.พ.30 (VAT return report) | v1 implement แล้ว 2026-09-04 — **แยกใบกำกับเต็มรูป/อย่างย่อ (§4.4 ข้อ 1) ทำแล้ว 2026-09-05** — ที่เหลือ §4.4 ข้อ 2–3 | ที่เหลือ: 2–3 วัน (§4.5 ปรับแล้ว) |
| §5 หนังสือรับรองหัก ณ ที่จ่าย | ✅ **implement แล้ว 2026-09-09** — `POST /payment-entries/:id/wht-certificate` + เทมเพลต ทวิ 50 · เหลือเฉพาะข้อที่ต้องรอข้อมูลจริง/ฝ่ายบัญชี (ดู §5.6) | — |

**ลำดับที่แนะนำถ้าจะหยิบมาทำต่อ**: §2 (root cause) → §3 P6 แกนกลาง (event consumers +
`processed_events` + read models 4 ตัวที่มีอยู่ในแผนแล้ว) → §1 พิมพ์เอกสารจริง (ใช้ read model/ข้อมูล
จริงจาก P6 แทน mock) → §5 (ต้องพิมพ์เอกสารได้ก่อนถึงจะออกแบบฟอร์มพิมพ์จริงได้) → กลับมาเติม §4.4
(stateful/print form ของ ภ.พ.30 ก็ต้องพิมพ์เอกสารได้ก่อนเหมือนกัน)

---

## 1 · ~~พิมพ์เอกสารจริงไม่ได้เลยสักใบ~~ — print engine ต่อครบวงจรแล้ว ✅ *(หัวข้อนี้เป็นบันทึกสถานะ as-is ของ 2026-09-04 เก็บไว้อ่านเป็นที่มา — สถานะปัจจุบันอยู่ที่ `HANDOFF-Document-Print-Pipeline.md` §7)*

> **อัปเดต 2026-09-08** — P2 ขึ้นโปรดักชันแล้ว (commit `d8b472b`): `POST /quotations/:id/print` +
> `POST /receipts/:id/print` เรียก `report.printDocument` จริงผ่าน RMQ → render → เก็บ
> `document_prints` · **ประโยคหัวข้อ "ไม่ได้เลยสักใบ" ไม่จริงอีกแล้ว** เหลือ P3 (HTML จริงแทน draft
> placeholder + เอนจิน `banded`), P4 (อีก 23 ใบ), P5 (สำเนา/ใบแทน รอฝ่ายบัญชี)
>
> **อัปเดต 2026-09-06 — มีเอกสารออกแบบแยกแล้ว: [`HANDOFF-Document-Print-Pipeline.md`](HANDOFF-Document-Print-Pipeline.md)**
> ตอบ design decision ทั้ง 3 ข้อของ §1.3 ด้านล่างครบแล้ว (ใครเรียกใคร · ผูกเทมเพลตยังไง · snapshot พอไหม)
> พร้อม schema `document_prints` (ประวัติการพิมพ์ — ของที่ยังไม่มีเลยวันนี้) และแผนงาน P0–P5 ·
> **คืบหน้าตั้งแต่เขียน §1 นี้**: `print_templates` + `document_types` ครบ 25 คู่จริงในโปรดักชันแล้ว
> (2026-09-06, ยังเป็น HTML draft) และ `document_types.print_template_id` เป็น FK จริง = เลือกเทมเพลต
> อัตโนมัติได้แล้ว · **blocker ตัวจริงที่เพิ่งพบ**: ระบบไม่มีข้อมูลผู้ประกอบการของเราเอง (ชื่อ/ที่อยู่/
> เลขผู้เสียภาษี) อยู่เลยสักที่ ซึ่ง §86/4 บังคับต้องมีบนใบกำกับ — ดู §6.1 ของเอกสารนั้น

### 1.1 สถานะโค้ดจริงวันนี้ (ตรวจแล้ว 2026-09-04, แก้ไขรอบสอง 2026-09-04 — พบโมดูลที่พลาดไปรอบแรก)

report-bc มี**สองระบบพิมพ์แยกกัน** ทั้งคู่ใช้งานได้จริงทางเทคนิค แต่**ไม่มีทางไหนเชื่อมกับเอกสารจริง
เลยสักทาง**:

**(ก) `apps/report-bc/src/modules/print/`** — pipeline เดียว ใช้ EJS → Gotenberg (HTML→PDF) → upload
storage-bc → presigned URL กลับมา endpoint เดียว:

```
POST /report/v1/invoices/mock-pdf
```

swagger description เขียนตรง ๆ ว่า "Demonstrates the report-bc print pipeline end to end... an empty
body `{}` renders a fully-populated sample invoice" — `CreateInvoicePrintDTO` ทุกฟิลด์
`@IsOptional()` เพราะออกแบบมาเป็น **smoke test ของ pipeline เอง** ไม่ใช่ endpoint พิมพ์เอกสารจริง
Template มีแบบเดียว (`templates/invoice.ejs`)

**(ข) `apps/report-bc/src/modules/print-template/`** — ระบบที่ใหญ่กว่าและ**ใช้งานจริงอยู่แล้วในระดับ
โครงสร้าง**: admin สร้าง/แก้เทมเพลตผ่าน `POST/PUT /print-templates` (HTML เก็บบน MinIO ไม่ใช่ Postgres),
มีระบบเวอร์ชัน + ประวัติ + restore (`print-template-histories`), preview (`POST .../preview`), และ
เอนจินสองแบบ (`simple`/`banded` — banded คือ pagination ฝั่ง client ผ่าน `paginator.inline.js` สำหรับ
รายงานที่ต้องพิมพ์หลายหน้า) — **ตรวจข้อมูลจริงในโปรดักชันวันนี้พบ 2 เทมเพลตที่ถูกสร้างไว้แล้ว**: `test`
กับ `PAYMENT_RECEIPT` (ชื่อไทย "ใบเสร็จรับเงิน") แต่ตรวจละเอียดแล้วพบว่า `PAYMENT_RECEIPT`:

- **`parameters` ว่างเปล่า (`[]`)** — ไม่มี schema กำหนดว่า field ไหนต้องส่งอะไร
- **`mock_data` ที่ผูกไว้เป็นโครงสร้างของระบบ POS ค้าปลีกอื่น** (`member_no`, `article_no`,
  `branch.name`: "บมจ.ซีพี เอ็กซ์ตร้า", `copy_type`) — **ไม่ตรงกับ field ของ `Receipt` entity ในระบบนี้
  เลยสักตัว** (`receipt_number`, `customer_tax_id`, `total_standard_vat_price` ฯลฯ) ยืนยันว่าเป็น
  เทมเพลตตัวอย่าง/อ้างอิงตอนออกแบบ ไม่ได้ผูกกับข้อมูลจริงของระบบนี้

**สิ่งที่ยืนยันแล้วว่าไม่มีอยู่จริงในทั้งสองระบบ**: ไม่มีจุดไหนเลย (`grep` ทั้ง `print/` และ
`print-template/`) ที่เรียก `sendWithContext`/`emitWithContext` ไปหา finance-bc/sales-bc/supplier-bc
เพื่อดึงข้อมูลเอกสารจริง — `sendWithContext` ที่มีใน `print-template.service.ts` ทุกจุดเรียกแค่
**storageClient** (อัปโหลด/เซ็น URL ของไฟล์เทมเพลตเอง) เท่านั้น `POST :id/render` รับ `params` เป็น
`Record<string, unknown>` ที่ client ส่งมาเองล้วน ๆ (`RenderPrintTemplateDTO`) —ไม่มีการ fetch
`receipt_id`/`quotation_id`/`ap_invoice_id` จากที่ไหนเลย

**สรุป**: โครงสร้างพื้นฐาน (template management + versioning + 2 เอนจิน) **ดีกว่าที่ประเมินไว้รอบแรก
มาก** — ไม่ต้องสร้างระบบจัดการเทมเพลตใหม่เลย งานที่แท้จริงที่ขาดคือ**ตัวเชื่อม (glue)**: โค้ดที่รับ
`document_id` จาก BC เจ้าของเอกสาร → แปลงเป็น `params` ตาม schema ของเทมเพลต → เลือกเทมเพลตให้ตรง
ประเภทเอกสาร → เรียก render — งานนี้ไม่มีอยู่เลยสักบรรทัดในทั้งระบบ

ไม่มี template สำหรับ: ใบเสนอราคา (Quotation), ใบสั่งขาย/ใบส่งของ (Sales Order/Delivery Note),
ใบกำกับภาษีเต็มรูป/อย่างย่อ (จริง — `PAYMENT_RECEIPT` ที่มีอยู่ผูกกับ mock data คนละระบบ), ใบสั่งซื้อ
(Purchase Order) — ฝั่งซื้อไม่มี template เลยสักแบบ

### 1.2 ทำไมเรื่องนี้สำคัญกว่าที่ดูตอนแรก

Phase 4/5 (PO, Quotation, Receipt, AP Invoice) ทั้งหมด **implement เสร็จ + มี business logic ที่ถูก
ต้องตาม §86/4 ประมวลรัษฎากรแล้ว** (เลขที่เอกสาร gapless, immutable หลัง ISSUED, snapshot ชื่อ/เลข
ผู้เสียภาษี ณ เวลาที่ออก ฯลฯ) — แต่**ไม่มีทางเอาเอกสารเหล่านั้นออกมาเป็น PDF ให้ลูกค้า/supplier ได้
เลยแม้แต่ใบเดียว** ผ่าน API ของระบบเอง ทั้งที่ backend ฝั่งกฎหมาย/ตัวเลขพร้อมหมดแล้ว — ทีมงานที่ใช้
ระบบจริงต้องพิมพ์เอกสารเอง (Excel/Word แยก) ซึ่งเสี่ยงตัวเลขไม่ตรงกับที่บันทึกในระบบ

### 1.3 ขอบเขตที่ต้องตัดสินใจก่อนเริ่ม (ไม่ใช่ correctness fix — เป็น design decision)

1. **ผูก `print_templates.code` เข้ากับ `document_type`** — `print_templates`/`document_types` เป็น
   คนละตารางไม่มี FK ถึงกันเลย (ยืนยันแล้ว 2026-09-04) เลือกเทมเพลตตอนนี้ทำได้แค่ผ่าน `code` ตรง ๆ
   ที่ client รู้เอง — ต้องตัดสินใจว่าจะ hard-code mapping (`document_type → template code`) ไว้ที่ BC
   เจ้าของเอกสาร หรือเพิ่มคอลัมน์ `document_type_id` บน `print_templates` ให้เลือกอัตโนมัติได้
2. **ใครเรียกใคร** — แต่ละ BC (finance/supplier/sales) ควรมี endpoint ของตัวเอง
   (`POST /receipts/:id/print`) ที่เรียก report-bc ผ่าน RPC พร้อมข้อมูลจริง หรือ report-bc ควรดึงข้อมูล
   เองผ่าน RPC ข้าม BC (`getReceiptById` ฯลฯ)? แนวทางแรกตรงกับ pattern
   "inject the owning service" ของ root CLAUDE.md มากกว่า (แต่ละ BC เป็นเจ้าของข้อมูลตัวเอง
   report-bc แค่รับ payload มา render)
3. **Snapshot ที่มีอยู่แล้วพอไหม** — เอกสารส่วนใหญ่ (Receipt/APInvoice/Quotation/SalesOrder/PO)
   snapshot ชื่อ/เลขผู้เสียภาษี/ที่อยู่ไว้ตาม "RULE · SNAPSHOT ไม่ใช่ JOIN" อยู่แล้ว (ดู
   erp-architecture.html §8.3) — น่าจะพอสำหรับพิมพ์ตรง ๆ โดยไม่ต้อง join เพิ่ม ยกเว้นที่อยู่บริษัท
   ผู้ออกเอกสาร (ของเราเอง) ซึ่งยังไม่รู้ว่าเก็บอยู่ที่ไหน (ต้องหา — อาจต้องเป็น system setting ใหม่)

### 1.4 ขอบเขตที่ควรอยู่นอกรอบแรก

- **สร้างเอนจิน banded ใหม่ — ไม่ต้องทำ มีอยู่แล้วและใช้งานได้จริง** (`template_engine: banded` +
  `paginator.inline.js` — แก้ไข 2026-09-04 จากที่เข้าใจผิดว่ายังไม่มีในรอบตรวจครั้งแรก) รอบแรกใช้แค่
  เขียน mapping ให้ template ที่มีอยู่แล้วรับข้อมูลจริงแทน mock data พอ ไม่ต้องแตะเอนจิน
- พิมพ์หลายภาษาในใบเดียว (มี `_th`/`_en` อยู่แล้ว แต่ใบพิมพ์จริงมักเลือกภาษาเดียวตาม locale ลูกค้า)

---

## 2 · finding ที่เกี่ยวเนื่อง — event ที่ส่งให้ report-bc หายไปเงียบ ๆ ตอนนี้เลย

**ไม่ใช่ backlog — เป็นความเสี่ยงที่เกิดขึ้นจริงในโปรดักชันตอนนี้** บันทึกไว้ในนี้เพราะเป็นสาเหตุที่ทำให้
§3 (P6) ต้องทำแบบ "ทั้งเฟส" ไม่ใช่ทำแค่ producer ฝั่งเดียว

### สิ่งที่ตรวจพบ (2026-09-04)

- `libs/common/src/utils/microservice-transport.util.ts` ตั้ง RMQ server ทุก BC ด้วย
  `noAck: false` (manual ack) + `prefetchCount: 1`
- `@nestjs/microservices`' `ServerRMQ` (`node_modules/@nestjs/microservices/server/server-rmq.js`)
  **ไม่ ack เอง** ตอน handler ทำงานสำเร็จ — ack ต้องมาจาก `RmqAckInterceptor` (root CLAUDE.md บังคับ
  ทุก `@EventPattern`/`@MessagePattern` handler ต้องมี) — และเมื่อ**ไม่มี handler ใดตรงกับ event
  name เลย** มันจะ `channel.nack(msg, false, false)` (ไม่ requeue)
- **ไม่มี dead-letter exchange ตั้งไว้ที่ไหนเลยในระบบ** — แปลว่า message ที่ nack แบบไม่ requeue จะ
  **หายถาวร ไม่มี log ไม่มี error ไม่มีทางกู้กลับมา**
- ยืนยันด้วย `grep -rl "@EventPattern" apps/report-bc apps/sales-bc apps/supplier-bc` → **ว่างทั้ง 3
  BC** — ไม่มี consumer เลยสักตัวในทั้งสามบริการนี้

### ผลกระทบจริงตอนนี้

`DOMAIN_EVENT_ROUTING` (`libs/common/src/constants/domain-event-routing.constant.ts`) route
เหตุการณ์ต่อไปนี้ไปหา report-bc: `lot.created` · `goods_receipt.submitted` · `stock.deducted` ·
`stock.adjusted` (เพิ่งเริ่ม emit จริงในรอบนี้ 2026-09-04) · `stock.deduction_reversed` ·
`sales_return.received` · `sales_return.reversed` · `profit.calculated` · `expiry.approaching` ·
`item.updated` (เพิ่งเริ่ม emit จริงในรอบนี้เช่นกัน) — **ทุกอีเวนต์เหล่านี้ที่ถูก emit ไปแล้วใน
โปรดักชันตอนนี้ ถูกทิ้งอย่างเงียบ ๆ ที่ report-bc ทันทีที่ consumer เชื่อมต่อคิว** ไม่มีใครเห็น ไม่มี
alert (ที่ route ไป finance-bc ด้วย เช่น `stock.deducted`/`sales_return.received` ไม่กระทบ เพราะ
finance-bc มี consumer จริงแล้ว — ปัญหาอยู่ที่ report-bc/sales-bc/supplier-bc เท่านั้น)

### ทางแก้ระยะสั้น (ทำได้โดยไม่ต้องรอ P6 เต็มเฟส)

1. ~~เพิ่ม dead-letter exchange ให้ RMQ setup~~ ✅ **ทำแล้ว 2026-09-05** — `erp.dlx`/`erp.dlq` ประกาศ
   ทุก BC ตอนบูต + broker policy `dlx-erp` ผูกเข้ากับทั้ง 8 คิวบน production จริงแล้ว (ไม่ redeclare
   คิวเดิม — ดู `rabbitmq-reliability-guide.html` §05 ว่าทำไม) ข้อความที่ nack เพราะไม่มี handler ตรง
   ไปนอนรอที่ `erp.dlq` แทนที่จะหายจริงแล้วตอนนี้ — รายละเอียดเต็ม: `HANDOFF-Feature.md` §
   "2026-09-05 · Legal/Accounting Audit" ส่วน B1
2. Monitoring: alert เมื่อ queue ของ report-bc มี `messages_ready` ค้างสูงผิดปกติ (สัญญาณเดียวกับที่
   root CLAUDE.md ใช้วินิจฉัย ack bug — แต่ที่นี่ค้างเพราะไม่มี handler ไม่ใช่ handler ไม่ ack) —
   **ยังไม่ทำ** (ไม่มี Grafana alert rule ให้ `erp.dlq`/`messages_ready` ยัง ต้องต่อเข้า
   `observability-logging-guide.html` เอง)
3. ข้อ 1 ปิดแล้ว — **ต้นเหตุจริงยังไม่แก้**: report-bc/sales-bc/supplier-bc ยังไม่มี consumer เลยสักตัว
   ข้อความที่ dead-letter ตอนนี้แค่ไม่หาย ไม่ได้แปลว่าถูกประมวลผล ยังต้องรอ P6 (§3) ถึงจะมี consumer จริง

---

## 3 · P6 ทั้งเฟส — CQRS Read Model (4/4 read model ทำแล้ว 2026-09-05 · ~224 ชม. เดิม)

อ้างอิง `srs-p6.html` (มีแผนเต็มอยู่แล้ว หัวข้อ 01–05) และ `erp-architecture.html` แถว Gantt:

| Task | ชม. | สถานะ |
|---|---|---|
| `report: event consumers + read models` | BE 56 | ✅ **4/4 ทำแล้ว 2026-09-05** — `profit_by_lot`/`expiry_alerts`/`low_stock`/`sales_summary` มี `@EventPattern` consumer + ตาราง + idempotency ครบ (ดู §3.1, §3.4, §3.5) |
| `report: APIs (sales/inv/expiry/profit-by-lot)` | BE 48 | ✅ **4/4 ทำแล้ว** — `GET /report-bc/v1/profit-by-lots`, `/expiry-alerts`, `/low-stocks`, `/sales-summaries` (ดู `api-workflow-guide.html` E2) |
| FE ที่เกี่ยวข้อง | FE 120 | `st-wait` (?) — รอทีม FE ตรวจ |
| **รวม P6** | **224** | **4/4 read model ทำแล้ว + deploy แล้ว (BE) · `sales_summary` E2E ผ่าน · `low_stock`/`expiry_alerts` รอ cron ยืนยัน · FE ยังไม่แตะ** |

### 3.1 ขอบเขตจาก srs-p6.html (ของเดิม ยังใช้ได้ทั้งหมด)

- ตาราง `processed_events` (event_id unique) — ทุก consumer ต้อง idempotent ผ่านตารางนี้
- Read model 4 ตัวที่มีแผนไว้แล้ว (ตาราง §04 ของ srs-p6.html):

  | Read Model | สร้างจาก event | ใช้ใน Dashboard | สถานะ |
  |---|---|---|---|
  | `sales_summary` | ~~`so.confirmed` · `invoice.issued`~~ → **`invoice.issued` เท่านั้น** | ยอดขายรายวัน/เดือน | ✅ **ทำแล้ว 2026-09-05** — `GET /report-bc/v1/sales-summaries` · ตัดขอบเขต `so.confirmed` ออกโดยตัดสินใจร่วมกับผู้ใช้ (ดู §3.5) |
  | `profit_by_lot` | `profit.calculated` | กำไรขั้นต้นต่อล็อต | ✅ **ทำแล้ว 2026-09-05** — `GET /report-bc/v1/profit-by-lots` |
  | `expiry_alerts` | `expiry.approaching` (เฉพาะตัวนี้พอ — ดูหมายเหตุ) | ล็อตใกล้หมดอายุ | ✅ **ทำแล้ว 2026-09-05** — `GET /report-bc/v1/expiry-alerts` (bind ผิด transport ตอน deploy เช้าวันเดียวกัน — แก้แล้ว ดู §3.5) |
  | `low_stock` | ~~`stock.deducted` · `stock.low`~~ → **`stock.low` เท่านั้น** | สินค้าใกล้หมด | ✅ **ทำแล้ว 2026-09-05** — `GET /report-bc/v1/low-stocks` · `stock.low` มีอยู่แล้วจริงจากสแกนกลางคืน `ReorderAlertModule` (คนละ mechanism จาก `DomainEvent` enum — ดู §3.5) |

  (หมายเหตุ: `expiry_alerts` ที่ implement จริงไม่ได้กิน `lot.created` ตามที่แผนเดิมเขียนไว้ — payload ของ
  `expiry.approaching` เป็น snapshot ครบทุกฟิลด์ต่อล็อตอยู่แล้ว (ชื่อสินค้า/คลัง/ต้นทุน ฯลฯ) จึงไม่มีอะไรที่
  `lot.created` ต้องเติมเพิ่ม เป็นการตัดขอบเขตที่ตั้งใจ ไม่ใช่ตกหล่น — ดู `srs-p6.html` RULE ใหม่ในหัวข้อนี้ ·
  `low_stock` ที่ implement จริงก็ไม่ได้กิน `stock.deducted` ด้วยเหตุผลเดียวกัน — payload ของ `stock.low`
  เป็น snapshot ครบทุกฟิลด์ต่อ shortfall อยู่แล้ว)

- `RULE · NO SYNC CALL ON QUERY` — query dashboard ห้ามเรียก transactional service ต้อง pre-compute
  ล่วงหน้าเท่านั้น
- `RULE · SHOW FRESHNESS` — แสดง `last_updated` บน dashboard สื่อสาร eventual consistency

### 3.2 สิ่งที่ต้องทำเพิ่มจากตอนเขียน srs-p6.html ครั้งแรก (คนละยุคกับตอนนี้)

Route table (`DOMAIN_EVENT_ROUTING`) และ outbox relay **มีอยู่แล้วทั้งคู่** (inventory-bc, finance-bc)
ต่างจากตอนเขียนแผนเดิมที่ยังไม่มี infra นี้เลย — งานที่เหลือจริง ๆ แคบกว่าที่ srs-p6.html ประเมินไว้:

1. ~~สร้าง outbox pattern~~ **มีแล้ว** — ข้ามได้ (finance-bc's `ReceiptsService.issue()` เพิ่ม hook
   `invoice.issued` เข้า outbox เดิมที่มีอยู่แล้ว ไม่ต้องสร้างใหม่)
2. ~~เขียน `@EventPattern` handler ใน report-bc ต่ออีเวนต์~~ ✅ **ทำครบ 4 ตัวแล้ว 2026-09-05**
   (`profit_by_lot`, `expiry_alert`, `low_stock`, `sales_summary` — ทุกตัวมี
   `@UseInterceptors(RmqAckInterceptor)` ตามกฎ) — `expiry_alert`/`low_stock` bind แบบ object pattern +
   `IMicroservicePayload<T>` (คนละ transport จาก `profit_by_lot`/`sales_summary` ที่ผ่าน outbox/relay
   จริง — ดู §3.5)
3. ~~สร้างตาราง `processed_events` + Read model 4 ตัว ใน `erp_report`~~ ✅ **`processed_events` +
   4/4 read model ทำแล้ว** (`profit_by_lots`, `expiry_alerts`, `low_stocks`, `sales_summaries`) —
   `processed_events` เพิ่มคอลัมน์ `consumer_name` กลางทาง (composite unique key ดู §3.5)
4. ~~Query API ต่อ read model~~ ✅ **4/4 ทำแล้ว** (`GET /profit-by-lots`, `/expiry-alerts`,
   `/low-stocks`, `/sales-summaries`)
5. Dashboard FE (นอกขอบเขต backend)

### 3.3 คำเตือนสำหรับตอน implement

- ทุก handler ต้อง idempotent จริง (เช็ค `processed_events` ก่อน apply ทุกครั้ง) — retry mechanism
  ที่เพิ่ง implement ในรอบนี้ (`sendWithContext`/`emitWithContext` retry — ดู root CLAUDE.md
  "Microservice calls") ทำให้โอกาสได้ event ซ้ำสูงขึ้นกว่าเดิม (แม้จะยังมาจาก at-least-once delivery
  ของ outbox relay อยู่แล้วเป็นทุนเดิมก็ตาม)
- Sales-bc/supplier-bc ก็ไม่มี consumer เหมือนกัน (§2) — ถ้า P6 คือรอบแรกที่ report-bc ได้ consumer
  จริง ควรพิจารณาว่า sales-bc/supplier-bc ต้องการ consumer ของตัวเองด้วยหรือไม่ (ตอนนี้ไม่มี
  route ไปหาทั้งคู่เลยเพราะเหตุผลเดียวกับที่ `item.updated` ไม่ route ไปให้ — ดู §04 ของ srs-p3.html)

### 3.4 ผลตรวจสอบ 2026-09-05 — 2/4 read model แรก ✅ **implement + migrate + deploy แล้ว**

**เลือกทำเฉพาะ 2 ตัวที่ event ต้นทางมีอยู่จริง** (`profit_by_lot` จาก `profit.calculated`,
`expiry_alerts` จาก `expiry.approaching`) — `sales_summary`/`low_stock` ยัง **blocked จริง** ไม่ใช่แค่
ลำดับความสำคัญต่ำ: ทั้ง `so.confirmed`/`invoice.issued`/`stock.low` ไม่มีอยู่ใน `DomainEvent` enum เลย
(`libs/common/src/enum/domain-event.enum.ts`, ตรวจแล้ว 2026-09-05) — ต้องมีคนตัดสินใจ+emit ฝั่ง
producer (sales-bc/inventory-bc) ก่อนถึงจะเขียนฝั่งรับที่ report-bc ได้ นี่คือคนละงานกับที่ทำรอบนี้

**สถาปัตยกรรม** — คัดลอก pattern จาก finance-bc's `CogsModule` (consumer ตัวแรกของทั้งแพลตฟอร์ม)
ทุกจุด: `ReportProcessedEvent extends ProcessedEventEntity` + `ReportProcessedEventsService extends
BaseProcessedEventService` (module แยกต่างหาก `processed-event/` เพราะมี 2 consumer ใช้ร่วมกัน ต่างจาก
finance-bc ที่ตอนนี้มีแค่ 1 consumer จึงเก็บไว้ในโมดูลเดียว) · `profit_by_lots` insert-only + unique
`(sale_id, lot_id)` (เหมือน `cogs_entries`) · `expiry_alerts` **upsert** ต่อ `lot_id` แทน (สแกนซ้ำทุกรอบ
ส่งล็อตเดิมมาซ้ำเสมอ — ใช้ `lot.created` ไม่ได้เพราะ payload ของ `expiry.approaching` เป็น snapshot ครบ
ทุกฟิลด์อยู่แล้ว ไม่มีอะไรให้ `lot.created` ต้องเติม เป็นการตัดขอบเขตที่ตั้งใจ)

**migration**: `1788608230132-AddP6ProfitByLotAndExpiryAlertReadModels.ts` (`erp_report`) —
`CREATE TABLE` ล้วน 3 ตาราง (`profit_by_lots`, `expiry_alerts`, `processed_events`) ไม่มี data risk
เลย รันแล้วบน DB จริง verify `migration:generate:report` = `No changes` · permission ใหม่ 2 ตัว
(`profit_by_lot:view`, `expiry_alert:view`) sync แล้ว + grant migration
`1788608297222-GrantP6ReadModelPermissionsToMockPolicies.ts` (`erp_iam`) รันแล้ว

**ตรวจแล้ว**: 1594/1594 test ผ่าน (+20 ใหม่ — claim/idempotency + insert-only vs upsert behavior ของ
ทั้งสอง consumer) · eslint 0/0 · `nx build report-bc` ผ่าน · boot จริง (`nest start report-bc`) แมป
route ครบ (`GET /profit-by-lots(/:id)`, `GET /expiry-alerts(/:id)`) DI resolve ไม่มี error ·
**ยังไม่ได้ E2E ด้วย event จริง** — ต้องรอการขายจริง (COGS posting) หรือรอบสแกนหมดอายุถัดไปของ
inventory-bc เกิดขึ้นเองถึงจะยิงทดสอบ end-to-end ผ่าน event จริงได้ (ต่างจาก AP invoice/settings ที่ยิง
ทดสอบเองผ่าน POST เดียวจบ) — ทิ้งไว้เป็นการตรวจสอบที่ยังติดค้างรอบหน้า

**เอกสาร**: `srs-p6.html` §06 (as-built) อัปเดตสถานะ + rulebox ใหม่อธิบายว่า 3 event ที่เหลือยังไม่มีจริง
· `api-workflow-guide.html` E2 ใหม่ (เทียบกับ `GET /inventory-bc/v1/expiry-alerts` ของจริงที่ยังสดกว่า)
+ endpoint index (report-bc 16→21 endpoints, พบ+แก้ doc drift เดิมที่ `POST .../invoices/mock-pdf`
หายจาก index ไปด้วยระหว่างทาง)

### 3.5 ผลตรวจสอบ 2026-09-05 (รอบสอง) — 4/4 read model ครบแล้ว ✅ **implement + migrate + deploy แล้ว, sales_summary E2E ผ่าน**

ต่อจาก §3.4 — ผู้ใช้สั่งทำ `sales_summary`/`low_stock` ที่เหลือให้ครบ วิจัยก่อนแก้พบว่า**สิ่งที่ §3.1/§3.4
บันทึกไว้เมื่อเช้าคลาดเคลื่อนบางส่วน**: `stock.low` **มีอยู่แล้วจริง**ในโปรดักชัน (สแกนกลางคืนของ
`ReorderAlertModule`/`ReorderAlertsService.scanAndEmit()`) — เพียงแต่ไม่ใช่ `DomainEvent` enum member
(เป็น `AppMicroservice.Report.cmd.InventoryEventResources.StockLow` คนละ mechanism, ส่งผ่าน
`emitWithContext()` ไม่ใช่ outbox/relay) ดังนั้น `low_stock` จึงไม่ blocked จริงเหมือนที่บันทึกไว้ — แค่
ต้องเขียน consumer ให้ตรง transport

**บั๊กจริงที่พบ (ไม่ใช่แค่ scope เพิ่ม)** — `ExpiryAlertEventsController` ที่ deploy ไปตอน §3.4 (เช้าวัน
เดียวกัน) bind ด้วย `@EventPattern(DomainEvent.ExpiryApproaching)` (string เปล่า) ซึ่ง**ไม่มีวันแมตช์กับ
`expiry.approaching`จริง** เพราะ inventory-bc ยิงด้วย object pattern (`{ cmd: 'expiry.approaching' }`)
ผ่าน `emitWithContext()` — envelope บนสายเป็น `IMicroservicePayload<T>` ไม่ใช่ `IDomainEventEnvelope`
ของ outbox ด้วย ยืนยันจากซอร์ส NestJS เอง (`transformPatternToRoute()`) เหตุการณ์จริงทุกตัวหายเข้า
`erp.dlq` เงียบ ๆ ตั้งแต่ deploy — **แก้แล้ว**: `@EventPattern({ cmd:
AppMicroservice.Report.cmd.InventoryEventResources.ExpiryApproaching })` + `IMicroservicePayload<T>` +
เอา `processed_events` claim ออก (ไม่มี UUID event_id ให้ claim ในทรานสปอร์ตนี้ — upsert-by-natural-key
กันซ้ำแทน) `low_stock` ใหม่ใช้รูปแบบที่ถูกตั้งแต่แรก

**บั๊กที่สอง (พบระหว่างทำ `sales_summary`)** — `processed_events.event_id` unique เดี่ยว ๆ ใช้ไม่ได้เมื่อ
มี **2 consumer อิสระต่อกัน** claim event เดียวกัน (`sales_summary` ต้อง consume `profit.calculated` ซ้ำ
กับ `profit_by_lot`) แก้โดยเพิ่ม `consumer_name` + composite unique key `(event_id, consumer_name)` ใน
`ProcessedEventEntity` (shared abstract class — กระทบ finance-bc's `CogsService` ด้วย ต้อง backfill
`consumer_name = 'cogs'` ให้ 2 แถวที่มีอยู่จริงก่อนตั้ง `NOT NULL`)

**ตัดสินใจกับผู้ใช้**: `sales_summary` ใช้ `invoice.issued` เป็นตัวขับเดียว ไม่สร้าง sales-bc outbox
module ใหม่เพื่อ `so.confirmed` — เหตุผลเดียวกับที่ `credit_limit`/aging ยึดเอกสารที่ออกจริงเสมอ ไม่ใช่
ตอน order commitment `ReceiptsService.issue()` (finance-bc) เพิ่ม stage event ในทรานแซกชันเดียวกับขึ้น
เลข/เปลี่ยนสถานะ ยิงทุก `document_type` (ใบเสร็จเงินสดก็นับ ไม่กรองเฉพาะใบกำกับภาษี)

**migration**: `AddLowStockReadModel`, `AddConsumerNameToProcessedEvents` ×2 (erp_report + erp_finance,
ฝั่ง finance มี backfill), `AddSalesSummaryReadModel` — รันแล้วบน DB จริงทั้งหมด · permission ใหม่ 2 ตัว
(`low_stock:view`, `sales_summary:view`) sync + grant migration แล้ว

**ตรวจแล้ว**: 1606/1606 test ผ่าน · eslint 0/0 · build ผ่านทั้ง report-bc/finance-bc · migration ทุก BC
= `No changes` after

**commit `a5563e5`/`8f8e962` + push + deploy สำเร็จ** (GitHub Actions run `33976232115`, 6m13s) ·
**`sales_summary` ยิง E2E บน production ด้วยเอกสารจริงแล้ว**: ออก+issue ใบเสร็จทดสอบ 2 ใบ
(`RCPT-2026-00002` ฿100, `RCPT-2026-00003` ฿250) — `GET /report-bc/v1/sales-summaries` ตอบยอดสะสมถูกต้อง
`total_sales 100→350`, `order_count 1→2`, `period` ตรง Bangkok midnight ยืนยันว่าการเพิ่มค่าทับบน
Postgres จริงทำงานถูกต้อง (ก่อนหน้านี้ตรวจแค่ unit test) และ `processed_events` composite key ไม่ชนกับ
`profit_by_lot` จริง · **`low_stock`/`expiry_alerts` ยังไม่ได้ยิง E2E** (รอ `@Cron` กลางคืน — expiry 01:00,
reorder 02:00 เวลาไทย, ไม่มี endpoint กดรันเอง) ตรวจได้แค่ route/permission ตอบถูกต้อง (ข้อมูลว่างเปล่า
ถูกต้องเพราะยังไม่ถึงรอบสแกนหลัง deploy)

### 3.6 ผลยืนยัน cron — 2026-09-11 ✅ **`expiry_alerts` ถูกต้อง · `low_stocks` พังมา 5 คืน แก้แล้ว**

ค้างมาตั้งแต่ §3.5 ("รอ `@Cron` กลางคืน") — กลับไปดูจริงแล้วได้คำตอบคนละแบบสำหรับสองตาราง:

- **`expiry_alerts` ว่างอย่างถูกต้อง** — `[Expiry Alert] Scanned 0 lot(s) expiring within 30 day(s)`
  ทุกคืน · `erp_inventory.lots` มี 2 แถวและ**ไม่มีแถวไหนมี `expiry_date`** จึงไม่มีอะไรให้เตือน
- **`low_stocks` ไม่เคยได้แถวเลย ทั้งที่ scan เจอ 114 คู่ทุกคืน** — cron ยิงจริง, report-bc รับจริง
  (`[LowStock] Received stock.low chunk 1/1, 114 product(s)`) แล้วตายที่ Postgres **21000
  `ON CONFLICT DO UPDATE command cannot affect row a second time`** เพราะตารางตั้ง unique ที่
  `product_id` เดี่ยว ขณะที่จุดสั่งซื้อตั้งต่อสินค้า**ต่อคลัง** (114 แถว / 70 สินค้า) → Postgres ตี
  ทิ้งทั้ง statement · แก้เป็น `(product_id, warehouse_id)` + migration + smoke ไฟล์แรกของ report-bc
  แล้ว deploy (รายละเอียด: `HANDOFF-Feature.md` §2 หัวข้อ **2026-09-11** · RULE ใหม่ 2 ข้อใน
  `srs-p6.html`)

**ยืนยันบนโปรดักชันแล้ว 2026-09-12** — scan รอบ 02:00 (19:00 UTC 2026-09-11) เขียนลงจริง: **114 แถว / 70 สินค้า / 6 คลัง / 113 แถว out of stock**, `last_scanned_at = 2026-09-11 19:00:00+00` ตรงกับที่ log ฝั่งยิงรายงานทุกตัวเลข · รอบก่อนหน้า (02:00 ของ 2026-09-11) ยังพังอยู่ด้วย **42P10** `there is no unique or exclusion constraint matching the ON CONFLICT specification` เพราะ migration ขึ้นก่อน deploy — เป็นช่วงคาบเกี่ยวที่รู้ตัวอยู่แล้ว และเป็นหลักฐานยืนยันการวินิจฉัยอีกทาง

**บทเรียนที่ใช้ได้กับ read model ทุกตัวที่เหลือ**: endpoint ที่ตอบ 200 + array ว่าง ไม่ได้แปลว่าระบบดี —
ต้องอ่าน log ฝั่งยิง + ฝั่งรับ + **error log ของ consumer** ก่อนจะสรุปว่า "ยังไม่มีข้อมูล"

---

## 4 · ภ.พ.30 — รายงานภาษีมูลค่าเพิ่ม (แบบแสดงรายการภาษีมูลค่าเพิ่ม)

### 4.1 ภ.พ.30 คืออะไร (สรุปจากที่ผู้ใช้อธิบายไว้ + core-feature.html)

แบบแสดงรายการภาษีมูลค่าเพิ่มตามประมวลรัษฎากร — ผู้ประกอบการจด VAT ต้องยื่นทุกเดือน **ภายในวันที่ 15
ของเดือนถัดไป** (ยื่นออนไลน์ผ่าน e-Filing ได้ขยายอีก 8 วัน) คำนวณจาก:

```
ภาษีขาย (Output VAT)  − ภาษีซื้อ (Input VAT)  = ภาษีที่ต้องชำระ (ถ้าบวก) / ภาษีที่ชำระเกิน (ถ้าลบ)
```

- **ภาษีขาย** — VAT จากใบกำกับภาษีที่ออกขายในเดือนนั้น (7% ของฐานภาษี)
- **ภาษีซื้อ** — VAT จากใบกำกับภาษีที่ได้รับจากการซื้อ/ค่าใช้จ่ายในเดือนนั้น — **ต้องเป็นใบกำกับภาษี
  เต็มรูปเท่านั้น** และมีอายุการใช้สิทธิไม่เกิน 6 เดือนนับจากวันที่ในใบกำกับ (ตามที่ผู้ใช้ระบุ)
- ภาษีที่ชำระเกินยกไปเดือนถัดไปได้ หรือขอคืนเป็นเงินสดได้ (แต่ส่วนใหญ่เลือกยกไป เพราะขอคืนเงินสด
  มีโอกาสถูกตรวจสอบเข้ม)
- ฟอร์มจริง (ตามภาพที่ผู้ใช้แนบ) มี 16 ช่อง หลัก ๆ: ยอดขาย/ยอดซื้อในเดือน, ภาษีขาย, ภาษีซื้อ, ภาษีที่
  ต้องชำระ/ชำระเกิน, ภาษีที่ชำระเกินยกมาจากเดือนก่อน ฯลฯ

### 4.2 สิ่งที่ระบบมีอยู่แล้ว (ไม่ต้องสร้างใหม่)

`IVatBucketedDocumentHeader` (`libs/common/src/interfaces/vat-bucketed-document.interface.ts`)
implement โดย `Receipt` (ฝั่งขาย) และ `APInvoice` (ฝั่งซื้อ) มีคอลัมน์ที่ตรงกับ 3 ช่องของ ภ.พ.30
พอดี:

```
total_standard_vat_price   → ยอดขาย/ซื้อที่ต้องเสีย VAT (standard rate, 7%)
total_zero_vat_price       → ยอดขาย/ซื้อ zero-rated (ส่งออก ฯลฯ)
total_exempt_vat_price     → ยอดขาย/ซื้อที่ยกเว้น VAT
```

docblock ของ `raw-vat-document-totals.interface.ts` เขียนไว้ตรง ๆ ว่า **"`total_standard_vat_price`
and friends exist for the ภ.พ.30 return"** — โครงสร้างข้อมูลถูกออกแบบรองรับรายงานนี้ไว้ตั้งแต่แรก
เพียงแต่ยัง**ไม่มีชั้น aggregation ที่รวมยอดข้ามเอกสารทั้งเดือน**

`vat_amount`/`net_amount` (จาก `IVatBucketedDocumentHeader`) ก็มีอยู่แล้วเช่นกัน — `vat_amount`
คือภาษีของทั้งเอกสาร (จะกลายเป็น "ภาษีขาย"/"ภาษีซื้อ" แล้วแต่ว่าเอกสารนั้นเป็น Receipt หรือ APInvoice)

### 4.3 สถานะตอนนี้ — v1 (คำนวณอย่างเดียว) implement แล้ว 2026-09-04

`GET /finance-bc/v1/vat-returns?year=&month=` (`vat_return:view`) คำนวณภาษีขาย/ภาษีซื้อ/ยอดสุทธิ
ของเดือนนั้นสด ๆ ทุกครั้งที่เรียก — ไม่มีตาราง `vat_returns`, ไม่มีสถานะ "ยื่นแล้ว" ผู้ใช้เลือกขอบเขตนี้
เองหลังเทียบสอง options (ดู commit ประกอบ) เพราะยังไม่มี requirement ชัดว่าต้อง freeze ตัวเลขหลังยื่น
จริงหรือรองรับยอดยกไปข้ามเดือนในรอบแรก — implement: `ReceiptsService.sumVatBucketsForPeriod()` +
`APInvoicesService.sumVatBucketsForPeriod()` (narrow method ต่อ owning service ตาม pattern
"inject the owning service") + `VatReturnsService` (รวมสองฝั่ง) + `businessMonthRange()` helper ใหม่
ใน `business-date.util.ts` · unit test 16 เคสใหม่ (2 owning-service method + `VatReturnsService`
combine logic + `businessMonthRange` boundary/rollover) · migration
`GrantVatReturnPermissionsToMockPolicies` ให้สิทธิ์ mock policies ตาม pattern เดิม

### 4.4 สิ่งที่ยังเป็น backlog (ไม่อยู่ใน v1)

1. ~~**แยกใบกำกับเต็มรูป vs อย่างย่อ**~~ ✅ **ทำแล้ว 2026-09-05** — `ap_invoices.vendor_tax_invoice_type`
   (enum `full_tax_invoice`/`abbreviated_tax_invoice`, AP Clerk ระบุจากใบกระดาษ) + `sumVatBucketsForPeriod()`
   กรองเฉพาะ `full_tax_invoice` (ตัดทั้งแถว ไม่ใช่แค่ `vat_amount`) — ยืนยันด้วย E2E จริงบน production
   (submit ใบ full + abbreviated, `purchases_exempt_vat_price` ไม่ขยับตามใบ abbreviated) รายละเอียดเต็ม:
   `HANDOFF-Feature.md` § "2026-09-05 · Legal/Accounting Audit" ส่วน A1, `srs-p5.html` RULE · VENDOR TAX
   INVOICE TYPE (§82/5, §86/6)
2. **6 เดือนอายุใช้สิทธิภาษีซื้อ** — ถ้าใบกำกับซื้อเดือนก่อน ๆ ถูกบันทึกช้า ต้องมีทางระบุว่าจะใช้
   เครดิตในเดือนไหน (ปกติ ภ.พ.30 มีช่องสำหรับภาษีซื้อสะสมที่ยังไม่ได้ใช้) — v1 สมมติว่าทุกใบกำกับถูก
   บันทึกภายในเดือนที่เกิดจริงเสมอ ไม่มีแนวคิด "ภาษีซื้อที่ยังไม่ได้ใช้เครดิต" เลย
3. **ยอดยกมา/ยกไป + สถานะ "ยื่นแล้ว" ต่อเดือน** — v1 คำนวณสดทุกครั้ง ไม่ freeze ตัวเลขหลังยื่นจริง —
   ถ้าแก้เอกสารย้อนหลัง (เช่น เพิ่มใบลดหนี้) หลังยื่นไปแล้ว เรียก endpoint ซ้ำจะได้ตัวเลขใหม่ที่ต่างจาก
   ที่เคยยื่นจริง ต้องมีคนดูแลเรื่องนี้เอง (พิมพ์/บันทึกไว้นอกระบบ) จนกว่าจะทำ snapshot ต่อเดือน
   (คล้าย `approval_threshold_snapshot` ของ Stock Adjustment)
4. **หน้าจอ/PDF ฟอร์มยื่นภาษีจริง** (แบบ 16 ช่องตามภาพที่ผู้ใช้แนบ) — ต้องผ่าน print engine (§1) ก่อน
   ถึงจะพิมพ์ฟอร์มจริงได้ — v1 ตอบแค่ JSON

### 4.5 ประเมินขนาดงานคร่าว ๆ ที่เหลือ

ฟอร์มพิมพ์จริง (ขึ้นกับ §1 เสร็จก่อน): 1 วัน · stateful "ยื่นแล้ว" + snapshot ต่อเดือน (ตาราง +
migration + workflow): 1–2 วัน · ~~แยกใบกำกับเต็มรูป/อย่างย่อ~~ ✅ ทำแล้ว 2026-09-05 (ดู §4.4 ข้อ 1) ·
6 เดือนอายุเครดิต (§82/3, ถ้าต้องการ): 1 วัน

---

## 5 · หนังสือรับรองการหักภาษี ณ ที่จ่าย (WHT Certificate)

### 5.1 ข้อมูลที่มีอยู่แล้ว

`IWithholdingTaxDocument` (`libs/common/src/interfaces/withholding-tax-document.interface.ts`)
implement โดย `Receipt` และ `APInvoice`:

```
wht_config_code   → tax_configs.code ที่มาของอัตรา (null = ไม่มีการหัก)
wht_rate          → อัตราหัก ณ ที่จ่าย (snapshot ตอนออกเอกสาร)
total_wht         → ยอดหัก ณ ที่จ่ายที่คาดไว้ (เพดานที่ payment เอาไปอ้างได้)
```

และที่ระดับการจ่ายเงินจริง — `PaymentAllocation.wht_amount` (ต่อใบที่ถูกตัด) กับ
`PaymentEntry.wht_amount`/`raw_wht_amount` (ระดับหัว) เก็บ**ยอดหัก ณ ที่จ่ายจริงที่เกิดขึ้นตอนจ่าย
เงิน** ซึ่งเป็นตัวเลขที่หนังสือรับรองต้องพิมพ์ (ไม่ใช่ `total_wht` ซึ่งเป็นแค่เพดาน)

### 5.2 ทิศทางที่ต้องออกใบจริง (สำคัญ — อย่าสลับทิศ)

หนังสือรับรองหัก ณ ที่จ่าย **ออกโดยผู้จ่ายเงิน ให้ผู้รับเงิน** ทันทีที่จ่ายเงิน (ไม่ใช่ตอนออกใบกำกับ/
ใบวางบิล) — กรณีของระบบนี้คือ:

- **เราจ่าย supplier** (`APInvoice` → `PaymentEntry` จ่ายออก) — **เราเป็นผู้ออกหนังสือรับรอง** ให้
  supplier — นี่คือ flow หลักที่ควร implement ก่อน
- **ลูกค้าจ่ายเรา** (`Receipt` → `PaymentEntry` รับเข้า) และลูกค้าหักภาษีเรา — **ลูกค้าเป็นผู้ออก
  หนังสือรับรองให้เรา** เราแค่เก็บบันทึกไว้อ้างอิงตอนยื่นภาษีเงินได้ปลายปี ไม่ต้องพิมพ์อะไรออกไป
  (แต่ยังต้องมีที่เก็บเลขที่/วันที่ของหนังสือรับรองที่ได้รับมา ถ้าจะทำให้ครบ)

### 5.3 ช่องว่างที่ต้องเติมก่อน implement (พบระหว่างสำรวจ 2026-09-04)

`ap_invoices` **ไม่มี** `supplier_tax_id` snapshot เลย (ต่างจาก `receipts.customer_tax_id` ที่มีอยู่
แล้ว) — ไม่สมมาตรกับรูปแบบ "snapshot ไม่ join" ที่ทั้งระบบยึดถือ (ดู "RULE · SNAPSHOT ไม่ใช่ JOIN" ใน
erp-architecture.html §8.3) หนังสือรับรองหัก ณ ที่จ่ายต้องพิมพ์เลขผู้เสียภาษีของ supplier — ถ้าไป
join `suppliers.tax_id` สดตอนพิมพ์จะผิดหลักการเดียวกับที่เอกสารอื่นทุกใบยึดอยู่ (ชื่อ/เลขที่เปลี่ยน
ทีหลัง เอกสารเก่าต้องไม่เปลี่ยนตาม) — **ต้องเพิ่มคอลัมน์ + migration ก่อนเริ่มฟีเจอร์นี้จริง**

ที่อยู่บริษัทของเราเอง (ผู้ออกหนังสือรับรอง) และเลขประจำตัวผู้เสียภาษีของบริษัท — ยังไม่รู้ว่าระบบเก็บ
ไว้ที่ไหน (อาจต้องเป็น system-wide setting ใหม่ ใช้ร่วมกับ §1/§4 ด้วย เพราะเอกสารพิมพ์ทุกใบต้องมีข้อมูล
บริษัทผู้ออกเหมือนกัน — ควรทำเป็น setting กลางจุดเดียว ไม่ใช่แยกทำต่อฟีเจอร์)

### 5.4 รูปแบบเอกสาร (ตามประเภทเงินได้ — ทวิ 50)

หนังสือรับรองการหักภาษี ณ ที่จ่ายมีฟอร์มมาตรฐาน (ทวิ 50) ต้องระบุ**ประเภทเงินได้ที่จ่าย** (เงินเดือน/
ค่าจ้าง/ค่าเช่า/ค่าบริการ/ฯลฯ ตามมาตรา 40) — ต้องตรวจว่า `tax_configs`/`wht_config_code` ปัจจุบันเก็บ
"ประเภทเงินได้" (ไม่ใช่แค่อัตรา) ไว้พอสำหรับพิมพ์ช่องนี้หรือไม่ (ยังไม่ได้ตรวจในรอบนี้ — ต้องสำรวจ
`tax_configs` entity ก่อนออกแบบจริง)

### 5.6 ผลตรวจสอบ — 2026-09-09 ✅ **implement + verify แล้ว**

**คำถามของ §5.4 ตอบแล้ว: `tax_configs` ไม่มีช่องประเภทเงินได้เลย** — มีแค่ `code`, `name_th/en`,
`tax_type` (vat|wht), `rate`, ช่วงมีผล, `is_accumulate`, `is_active` · รหัสอย่าง `WHT3_SERVICE` เป็นแค่
ธรรมเนียมการตั้งชื่อ ไม่ใช่ข้อมูล · จึงเพิ่ม **`wht_income_type`** (enum ตามช่องในแบบ ภ.ง.ด.3/53:
ม.40(1)–(8) รวม `transport_40_8` แยกจาก `service_40_8` เพราะอัตราและป้ายต่างกัน) — **บังคับกรอกเมื่อ
`tax_type=wht`**, บังคับ `null` เมื่อเป็น vat, และ `supersede()` สืบทอดต่อเหมือน `code`/`tax_type`
(การ supersede เปลี่ยนอัตรา ไม่ได้เปลี่ยนว่าหักจากเงินได้ประเภทไหน)

**snapshot ที่ขาดอีก 5 คอลัมน์** (นอกจาก `ap_invoices.supplier_tax_id` ที่ §5.3 จับไว้):
`ap_invoices.supplier_address`, และ `payment_entries.party_tax_id` / `party_address` /
`party_is_juristic` · ทั้งหมดได้จาก lookup ที่ `resolveParty()`/`resolveSupplier()` เรียกอยู่แล้วแต่ทิ้ง
ผลไป · `party_is_juristic` คือตัวตัดสิน **ภ.ง.ด.53 (นิติบุคคล) vs ภ.ง.ด.3 (บุคคลธรรมดา)** ที่ ทวิ 50
ต้องระบุ — ไม่ทราบก็พิมพ์ว่าง ไม่เดา (ยื่นผิดแบบแย่กว่าเว้นช่องให้คนกรอก)

**endpoint** `POST /payment-entries/:id/wht-certificate` (`payment_entry:print_wht_certificate`) ·
guard 3 ชั้นคือความปลอดภัยทั้งหมด: **PAY เท่านั้น** (เงินที่ลูกค้าจ่ายเราแล้วหักภาษี ลูกค้าเป็นผู้ออก
หนังสือรับรอง ถ้าเราออกเองคือรับรองภาษีที่เราไม่ได้นำส่ง) · **SUBMITTED เท่านั้น** · **`wht_amount > 0`**

**ตัวเลขคือยอดที่หักจริงตอนจ่าย ไม่ใช่ `total_wht` เพดานที่ใบตั้งหนี้ประมาณไว้** (ต่างกันทุกครั้งที่จ่าย
บางส่วน) จัดกลุ่มตามประเภทเงินได้เพราะ ทวิ 50 รายงานเป็นประเภทไม่ใช่รายใบ · allocation ที่ไม่หักภาษี
หรือ config ที่ไม่มีประเภทเงินได้ → ข้าม ไม่พิมพ์แถวไร้ป้าย (ผู้ถูกหักเอาไปยื่นไม่ได้)

**seed อัตราจริงแล้ว 6 ตัว** (2026-09-09): `WHT1_TRANSPORT` 1% ค่าขนส่ง · `WHT2_ADVERTISING` 2% ·
`WHT3_SERVICE` 3% · `WHT3_CONTRACT` 3% ค่าจ้างทำของ (ม.40(7)) · `WHT3_PROFESSIONAL` 3% (ม.40(6)) ·
`WHT5_RENT` 5% (ม.40(5)) · **ตรวจก่อน seed ว่าปลอดภัย**: ทุกจุดที่ resolve WHT ส่ง `code` มาด้วยเสมอ
มีแค่ VAT ที่ resolve แบบไม่ระบุ code จึงมีหลาย WHT rate เปิดพร้อมกันได้โดยไม่ทำให้
`resolveEffectiveRate` คืน 409

**e2e บนของจริงผ่านแล้ว 2026-09-09** (ผู้ใช้อนุมัติให้ใช้ mock data) — เดินทั้งสายบนบริการจริง:
ใบตั้งหนี้ผูก `WHT3_SERVICE` → submit (GL ลง) → ใบสำคัญจ่ายที่หักภาษี → submit → ออกหนังสือรับรอง →
PDF จริง 74,491 bytes → **ยกเลิกทั้งสองใบคืน** (GL กลับเป็นศูนย์: `AP_INVOICE` 400/400,
`PAYMENT_ENTRY` 400/400, สถานะ CANCELLED ทั้งคู่) · สิ่งที่ยังอยู่คือแถว `document_prints` ซึ่งเป็น
หลักฐานที่ต้องการ

ผลที่พิสูจน์ได้จากรอบนี้ (ไม่ใช่แค่ unit test):
- **คอลัมน์ snapshot ใหม่ถูกเติมจริงตอนสร้างเอกสาร** — `ap_invoices.supplier_tax_id`
  (`0105561001234`) + `supplier_address`, และ `payment_entries.party_tax_id` / `party_address` /
  `party_is_juristic = true`
- **`wht_rate 3` / `total_wht 6` คำนวณจาก config ที่ seed ไว้จริง** (ไม่ได้ส่งมาจาก client)
- **หนังสือรับรองพิมพ์ถูกทุกช่อง**: ผู้หัก = ข้อมูลบริษัทจาก `company_profiles` · ผู้ถูกหัก = ชื่อ/เลข
  ผู้เสียภาษี/ที่อยู่จาก snapshot · **ภ.ง.ด.53** จาก `party_is_juristic` · ประเภทเงินได้
  "ค่าบริการ/อื่น ๆ ตามมาตรา 40(8)" จาก `tax_configs.wht_income_type` · 200.00 / 6.00 / หกบาทถ้วน
- **การหักภาษีในรอบนี้เป็น mock ที่ผิดหลักบัญชีโดยรู้ตัว** — บรรทัด GRN ที่ว่างอยู่เป็นค่าสินค้า ซึ่ง
  หักภาษี ณ ที่จ่ายไม่ได้ · จึงยกเลิกทั้งสองใบทันทีหลังพิมพ์ ไม่ทิ้งการหักภาษีผิดประเภทไว้ใน ledger

smoke ยืนยันทุกรอบ: guard คืน 400 บนเอกสารที่มีอยู่ + **เรนเดอร์เทมเพลต ทวิ 50 ผ่าน Gotenberg จริง**
(รอยต่อที่ unit test เอื้อมไม่ถึง — params key ที่เทมเพลตไม่อ่านคือหน้ากระดาษว่างตรงที่ควรมีเลข) ·
เมื่อมีการจ่ายเงินหักภาษีจริงในระบบ smoke สลับไปพิมพ์ของจริงเอง

**ยังเหลือ (ต้องรอคนตัดสิน)**:

1. **เลขที่หนังสือรับรอง** — v1 ใช้เลขใบสำคัญจ่าย และตั้ง `has_running_number: false` ไว้ · ถ้าฝ่ายบัญชี
   ต้องการเลขชุดของตัวเอง (สำหรับ "ลำดับที่" ในแบบ ภ.ง.ด.) ต้องเพิ่ม counter + ขั้นออกเลข
2. ~~**ผู้ถูกหักที่เป็นบุคคลธรรมดา**~~ ✅ **รองรับแล้ว 2026-09-09** — นอกจาก `filing_form` ที่เป็น
   **ภ.ง.ด.3** อยู่แล้ว เพิ่ม **`payee_tax_id_label`**: นิติบุคคลใช้ "เลขประจำตัวผู้เสียภาษีอากร"
   บุคคลธรรมดาใช้ **"เลขประจำตัวประชาชน"** (13 หลักเท่ากัน ต่างกันแค่ชื่อเรียก — ฟอร์มที่เรียกเลข
   บัตรประชาชนว่าเลขผู้เสียภาษีนิติบุคคลคือฟอร์มที่กรอกผิดตั้งแต่หน้าแรก) · ไม่ทราบประเภท (ใบเก่าที่ยัง
   ไม่มี snapshot) พิมพ์ "เลขประจำตัวผู้เสียภาษี/ประชาชน" ไม่เดาข้างใดข้างหนึ่ง

   **ยืนยันบนของจริง**: สร้างผู้ขาย `supplier_type=individual` → ใบสำคัญจ่าย DRAFT (ไม่ลง GL)
   snapshot `party_is_juristic=false` จริง → เรนเดอร์ ทวิ 50 ผ่าน Gotenberg ได้ **ภ.ง.ด.3 +
   "เลขประจำตัวประชาชน 1234567890123"** → ลบเอกสารและผู้ขายทดสอบทิ้ง · ระหว่างทาง 3-way match
   ปฏิเสธถูกต้องเมื่อพยายามตั้งหนี้ใบรับสินค้าของผู้ขายรายอื่น (`an invoice can only bill receipts
   from its own supplier`)

   **แก้ข้อมูลผิดที่เจอ 1 ราย**: `SUP-EQP-02 ห้างหุ้นส่วนจำกัด ช่างเกษตรไทย` ถูกตั้งเป็น `individual`
   ทั้งที่ หจก. เป็นนิติบุคคล (เลขผู้เสียภาษีขึ้นต้น 0 = ทะเบียนนิติบุคคล) — ถ้าออกหนังสือรับรองให้ราย
   นี้จะระบุ ภ.ง.ด.3 และเรียกทะเบียนนิติบุคคลว่าเลขบัตรประชาชน ผิดทั้งสองช่อง · แก้เป็น `company` แล้ว ·
   ตรวจอีก 13 รายที่เหลือ ชื่อกับประเภทตรงกันหมด

### 5.5 ประเมินขนาดงานคร่าว ๆ

Migration เพิ่ม `supplier_tax_id`: 0.5 วัน (รวมทดสอบ) · หา/ทำ company settings (ถ้ายังไม่มี): 0.5–1
วัน · endpoint + DTO ดึงข้อมูลสำหรับพิมพ์: 1 วัน · ฟอร์มพิมพ์ (ขึ้นกับ §1): 1 วัน — รวม **~3 วันคนเดียว**
ถ้า §1 เสร็จก่อนแล้ว ไม่รวมเวลาตรวจ `tax_configs` ว่าเก็บประเภทเงินได้ครบหรือยัง (§5.4)

---

## 6 · เอกสารที่แก้ไปแล้วระหว่างเขียน backlog นี้ (ไม่ใช่ backlog — ปิดแล้ว)

ระหว่างสำรวจเพื่อเขียนเอกสารนี้ พบ doc drift 1 จุดใน `srs-p6.html` §06 — บอกว่า "ทั้งระบบยังไม่มี
outbox" ทั้งที่ inventory-bc/finance-bc มี `OutboxService` จริงแล้ว (คนละปัญหากับที่ report-bc ไม่มี
consumer) แก้ note ให้ตรงกับโค้ดจริงแล้วในรอบเดียวกับที่เขียนเอกสารนี้ (ดู commit ของรอบ 2026-09-04)

---

## 7 · `document_types.has_running_number` — ปรับเป็น false ทั้งหมด (2026-09-09)

26 ใน 27 แถวตั้ง `has_running_number = true` พร้อม `running_number_format` (เช่น
`APINV-{YYYY}-{SEQ:5}`) ทั้งที่ **ไม่มีอะไรนอก report-bc เรียกขอเลขจากมันเลย** — ตรวจแล้วทุก BC:
เลขเอกสารทุกใบออกจาก counter ของ BC เจ้าของเอง (`receipt_number_counters`,
`purchase_order_number_counters`, quotation/GRN/SRN counters) **ในทรานแซกชันเดียวกับตัวเอกสาร** ซึ่ง
เป็นทางเดียวที่กฎเลขไม่ข้าม (§86/4) จะบังคับได้จริง · ตาราง `document_running_numbers` มีแค่ 3 แถว
และสองแถวเป็นของ document type ขยะ (`test_invoice`, `invoice`)

ปรับทั้ง 27 แถวเป็น `false` + แก้คอมเมนต์คอลัมน์ให้ระบุว่ามันหมายถึง "**report-bc เป็นผู้ออกเลขให้
เอกสารนี้หรือไม่**" ไม่ใช่ "เอกสารนี้มีเลขที่หรือไม่" — คนอ่าน schema เดิมจะเข้าใจว่า report-bc เป็นเจ้าของ
การออกเลข แล้วไปต่อยอดผิดทาง
