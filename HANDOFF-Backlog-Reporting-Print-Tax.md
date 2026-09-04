# HANDOFF — Backlog: พิมพ์เอกสารจริง · P6 (Reporting) · ภ.พ.30 · หนังสือหัก ณ ที่จ่าย

> **เอกสาร backlog ของ product** — ไม่ใช่ session-tracking file แบบ `HANDOFF-Feature.md` — เก็บไว้ยาว
> จนกว่าจะหยิบมาทำจริง ลบทิ้งได้เฉพาะเมื่อทุกหัวข้อในนี้ปิดแล้ว (แต่ละหัวข้อ archive แยกไปที่ SRS/
> erp-architecture.html ตอนปิดงานจริง เหมือน pattern ที่ `HANDOFF-Feature.md` ทำกับงานที่เสร็จแล้ว)
>
> เขียนเมื่อ 2026-09-04 ระหว่างทำ "5 fixes แรก" (`stock_uom_id` immutable, password policy,
> `item.updated`, `stock.adjusted`, item group leaf) — พบว่า audit รอบนั้นมี 4 หัวข้อที่**ใหญ่เกินจะทำ
> ในรอบเดียว** จึงแยกมาบันทึกที่นี่แทนตามที่ผู้ใช้สั่ง ไม่ได้ implement อะไรในไฟล์นี้เลยสักบรรทัด

## 0 · สรุปสั้น — ทำไมแยกเป็น backlog แทนที่จะทำเลย

| หัวข้อ | ทำไมไม่ทำตอนนี้ | ขนาดคร่าว ๆ |
|---|---|---|
| §1 พิมพ์เอกสารจริงไม่ได้เลยสักใบ | ต้องออกแบบ template registry + ตัดสินใจว่า BC ไหนเรียก report-bc ยังไง — ไม่ใช่ correctness bug เดียว แต่เป็นงานสร้างฟีเจอร์ใหม่ | หลายวัน (ทั้งชุด) |
| §2 report-bc consumer หาย (่finding เกี่ยวเนื่อง) | ต้นเหตุของทั้ง P6 และ item.updated/stock.adjusted ที่เพิ่ง emit ได้จริงในรอบนี้ — แก้จริงต้องมี read model ให้ project เข้า (คือ P6 นั่นเอง) | รวมอยู่ใน P6 |
| §3 P6 ทั้งเฟส (CQRS Read Model) | 0/2 แถวใน Gantt (`report: event consumers + read models` BE 56 · `report: APIs` BE 48) + FE 120 ชม. — รวม **224 ชม.** ทั้งเฟส ไม่ใช่ของที่ทำแทรกได้ | ~224 ชม. (104 BE + 120 FE), W22–25 ใน Gantt เดิม |
| §4 ภ.พ.30 (VAT return report) | ต้องมี aggregation layer ข้ามเอกสาร (Receipt + AP Invoice) ทั้งเดือน — เป็นงานระดับ report ไม่ใช่แก้บรรทัดเดียว แม้ buckets จะมีอยู่แล้ว | 2–4 วัน (ประเมินใน §4.5) |
| §5 หนังสือรับรองหัก ณ ที่จ่าย | เหมือน §1 (ต้องมี print path) + ยังขาดบาง snapshot field (`ap_invoices.supplier_tax_id`) ที่ต้องเพิ่มก่อน | 2–3 วัน (ประเมินใน §5.5) |

**ลำดับที่แนะนำถ้าจะหยิบมาทำ**: §2 (root cause) → §3 P6 แกนกลาง (event consumers + `processed_events`
+ read models 4 ตัวที่มีอยู่ในแผนแล้ว) → §1 พิมพ์เอกสารจริง (ใช้ read model/ข้อมูลจริงจาก P6 แทน mock)
→ §4/§5 (ทั้งคู่ต้องพิมพ์เอกสารได้ก่อนถึงจะออกแบบฟอร์มพิมพ์จริงได้ แม้ตัวเลขคำนวณแยกจาก P6 ก็ตาม)

---

## 1 · พิมพ์เอกสารจริงไม่ได้เลยสักใบ — print engine ต่อไม่ครบวงจร

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

1. เพิ่ม dead-letter exchange ให้ RMQ setup — อย่างน้อยข้อความที่ถูก nack จะไปนอนรอที่ DLQ แทนที่จะ
   หายจริง ให้ทีม ops เห็นและ requeue ได้ทีหลัง
2. Monitoring: alert เมื่อ queue ของ report-bc มี `messages_ready` ค้างสูงผิดปกติ (สัญญาณเดียวกับที่
   root CLAUDE.md ใช้วินิจฉัย ack bug — แต่ที่นี่ค้างเพราะไม่มี handler ไม่ใช่ handler ไม่ ack)
3. ทั้งสองข้อนี้เป็น **infra fix เล็ก ไม่ต้องรอ P6** ควรพิจารณาทำแยกก่อนเพื่อหยุดเลือดที่ไหลอยู่ตอนนี้

---

## 3 · P6 ทั้งเฟส — CQRS Read Model (0/2 แถวใน Gantt · ~224 ชม.)

อ้างอิง `srs-p6.html` (มีแผนเต็มอยู่แล้ว หัวข้อ 01–05) และ `erp-architecture.html` แถว Gantt:

| Task | ชม. | สถานะ |
|---|---|---|
| `report: event consumers + read models` | BE 56 | `st-none` (×) — "ต้องมี outbox ฝั่ง producer ก่อน" (**ข้อนี้ stale แล้ว** — outbox ฝั่ง producer มีจริงที่ inventory-bc/finance-bc ตั้งแต่ก่อนรอบนี้ — แก้ note ใน srs-p6.html แล้ว 2026-09-04) |
| `report: APIs (sales/inv/expiry/profit-by-lot)` | BE 48 | `st-none` (×) |
| FE ที่เกี่ยวข้อง | FE 120 | `st-wait` (?) — รอทีม FE ตรวจ |
| **รวม P6** | **224** | **0/2 แถว BE** |

### 3.1 ขอบเขตจาก srs-p6.html (ของเดิม ยังใช้ได้ทั้งหมด)

- ตาราง `processed_events` (event_id unique) — ทุก consumer ต้อง idempotent ผ่านตารางนี้
- Read model 4 ตัวที่มีแผนไว้แล้ว (ตาราง §04 ของ srs-p6.html):

  | Read Model | สร้างจาก event | ใช้ใน Dashboard |
  |---|---|---|
  | `sales_summary` | `so.confirmed` · `invoice.issued` | ยอดขายรายวัน/เดือน |
  | `profit_by_lot` | `profit.calculated` | กำไรขั้นต้นต่อล็อต |
  | `expiry_alerts` | `expiry.approaching` · `lot.created` | ล็อตใกล้หมดอายุ |
  | `low_stock` | `stock.deducted` · `stock.low` | สินค้าใกล้หมด |

  (หมายเหตุ: `stock.adjusted`/`item.updated` เพิ่ง emit จริงได้ในรอบ 2026-09-04 — ยังไม่มี read model
  ในแผนเดิมที่ผูกกับสองอีเวนต์นี้โดยตรง ถ้าจะทำ P6 ควรพิจารณาว่า `low_stock`/`inventory_summary`
  ควรกิน `stock.adjusted` ด้วยหรือไม่ เพราะการปรับสต็อกก็เปลี่ยนยอดคงเหลือเหมือนกัน)

- `RULE · NO SYNC CALL ON QUERY` — query dashboard ห้ามเรียก transactional service ต้อง pre-compute
  ล่วงหน้าเท่านั้น
- `RULE · SHOW FRESHNESS` — แสดง `last_updated` บน dashboard สื่อสาร eventual consistency

### 3.2 สิ่งที่ต้องทำเพิ่มจากตอนเขียน srs-p6.html ครั้งแรก (คนละยุคกับตอนนี้)

Route table (`DOMAIN_EVENT_ROUTING`) และ outbox relay **มีอยู่แล้วทั้งคู่** (inventory-bc, finance-bc)
ต่างจากตอนเขียนแผนเดิมที่ยังไม่มี infra นี้เลย — งานที่เหลือจริง ๆ แคบกว่าที่ srs-p6.html ประเมินไว้:

1. ~~สร้าง outbox pattern~~ **มีแล้ว** — ข้ามได้
2. เขียน `@EventPattern` handler ใน report-bc ต่ออีเวนต์ (พร้อม `@UseInterceptors(RmqAckInterceptor)`
   ตามกฎ root CLAUDE.md ทุกตัว — ไม่งั้นจะสร้างปัญหา head-of-line block ใหม่แทนที่จะแก้ปัญหาเดิม)
3. สร้างตาราง `processed_events` + Read model 4 ตัว ใน `erp_report`
4. Query API ต่อ read model (`report: APIs` แถวที่สอง)
5. Dashboard FE (นอกขอบเขต backend)

### 3.3 คำเตือนสำหรับตอน implement

- ทุก handler ต้อง idempotent จริง (เช็ค `processed_events` ก่อน apply ทุกครั้ง) — retry mechanism
  ที่เพิ่ง implement ในรอบนี้ (`sendWithContext`/`emitWithContext` retry — ดู root CLAUDE.md
  "Microservice calls") ทำให้โอกาสได้ event ซ้ำสูงขึ้นกว่าเดิม (แม้จะยังมาจาก at-least-once delivery
  ของ outbox relay อยู่แล้วเป็นทุนเดิมก็ตาม)
- Sales-bc/supplier-bc ก็ไม่มี consumer เหมือนกัน (§2) — ถ้า P6 คือรอบแรกที่ report-bc ได้ consumer
  จริง ควรพิจารณาว่า sales-bc/supplier-bc ต้องการ consumer ของตัวเองด้วยหรือไม่ (ตอนนี้ไม่มี
  route ไปหาทั้งคู่เลยเพราะเหตุผลเดียวกับที่ `item.updated` ไม่ route ไปให้ — ดู §04 ของ srs-p3.html)

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

### 4.3 สิ่งที่ยังไม่มี

1. **Aggregation query ข้ามเอกสารทั้งเดือน** — `SUM(vat_amount)` ของทุก `Receipt` ที่
   `status != DRAFT` และ `document_date` อยู่ในเดือนนั้น (ภาษีขาย) กับทุก `APInvoice` ที่
   `status = SUBMITTED`/`APPROVED`... (ภาษีซื้อ) — ต้องนิยามให้ชัดว่า "เดือนภาษี" คิดจาก
   `document_date` หรือวันที่ใบกำกับจริง (ตาม §86/4 การออกใบกำกับต้องตรงกับวันที่ธุรกรรม —
   ธุรกิจส่วนใหญ่ใช้ `document_date` เป็นตัวตัดเดือน)
2. **แยกใบกำกับเต็มรูป vs อย่างย่อ** — `Receipt.document_type` มีอยู่แล้ว (`TAX_INV`/`ABB_TAX_INV`/
   plain receipt) ภาษีซื้อของผู้อื่นที่ซื้อจากเรา (ใบกำกับอย่างย่อ) **ใช้เครดิตภาษีไม่ได้** ตาม
   ประมวลรัษฎากร — แต่นี่คือกฎของ**ผู้ซื้อ** ไม่ใช่ของเรา (เราคือผู้ออก) กฎที่เกี่ยวกับเราโดยตรงคือ
   ภาษีซื้อฝั่งเรา (จาก `APInvoice` ที่รับจาก supplier) ต้องมาจากใบกำกับเต็มรูปเท่านั้น — **ต้องตรวจ
   ว่า `APInvoice` มีการเก็บ document_type ของใบกำกับที่ supplier ออกให้หรือไม่** (ยังไม่ได้ตรวจใน
   รอบนี้ — ต้องสำรวจก่อนออกแบบ query จริง)
3. **6 เดือนอายุใช้สิทธิภาษีซื้อ** — ถ้าใบกำกับซื้อเดือนก่อน ๆ ถูกบันทึกช้า ต้องมีทางระบุว่าจะใช้
   เครดิตในเดือนไหน (ปกติ ภ.พ.30 มีช่องสำหรับภาษีซื้อสะสมที่ยังไม่ได้ใช้) — ระบบตอนนี้ไม่มีแนวคิด
   "ภาษีซื้อที่ยังไม่ได้ใช้เครดิต" เลย ต้องออกแบบเพิ่มถ้าจะรองรับกรณีนี้ (v1 อาจข้ามได้ ถ้าสมมติว่า
   ทุกใบกำกับถูกบันทึกภายในเดือนที่เกิดจริงเสมอ)
4. **ยอดยกมา/ยกไป** — ภาษีที่ชำระเกินเดือนก่อนต้องยกมาลดเดือนนี้ — ต้องมีตารางเก็บสถานะการยื่นภาษีต่อ
   เดือน (คล้าย `stock_settings`/`sales_settings` แต่เป็น per-month แทนที่จะเป็น singleton)
5. **หน้าจอ/PDF ฟอร์มยื่นภาษีจริง** (แบบ 16 ช่องตามภาพที่ผู้ใช้แนบ) — ต้องผ่าน print engine (§1) ก่อน
   ถึงจะพิมพ์ฟอร์มจริงได้

### 4.4 แนวทางที่แนะนำ (ยังไม่ตัดสินใจ — ต้องคุยกับผู้ใช้ก่อนเริ่ม)

- ทำเป็นส่วนหนึ่งของ **finance-bc** ไม่ใช่ report-bc — เพราะข้อมูลต้นทางทั้งหมด (`receipts`,
  `ap_invoices`) อยู่ใน `erp_finance` อยู่แล้ว การ query ข้าม BC ไปหา report-bc จะผิดกฎ
  database-per-context โดยไม่จำเป็น (report-bc ควรเก็บแค่ read model ที่ project จาก event เท่านั้น
  ไม่ใช่ query แบบ ad-hoc ข้าม BC)
- Endpoint: `GET /finance/v1/vat-returns?year=2026&month=9` (หรือ resource `vat-returns` เต็มรูป ถ้า
  ต้องการเก็บประวัติการยื่นแต่ละเดือนแบบมี state เหมือนเอกสาร submittable อื่น ๆ — ดูจากภาพหน้าจอ
  reference ที่ผู้ใช้แนบ ระบบภาษีจริงมักมี state "ร่าง/ยื่นแล้ว" ต่อเดือน)
- ควรพิจารณาเก็บเป็น **snapshot ต่อเดือนหลังยื่นจริง** (คล้าย `approval_threshold_snapshot` ของ Stock
  Adjustment) เพราะถ้ามีการแก้เอกสารย้อนหลัง (เช่น เพิ่มใบลดหนี้) หลังยื่น ภ.พ.30 ไปแล้ว ตัวเลขที่
  เคยยื่นต้องไม่เปลี่ยนตาม — การแก้ไขทำผ่านการยื่นเพิ่มเติม (ภ.พ.30.2) ไม่ใช่แก้ยอดเดือนเดิม

### 4.5 ประเมินขนาดงานคร่าว ๆ

Aggregation query + endpoint + DTO: 1–1.5 วัน · unit test: 0.5 วัน · หน้าจอสรุป (ถ้าทำ backend
ให้ FE เรียกอย่างเดียว ไม่รวม FE เอง): 0.5 วัน · ฟอร์มพิมพ์จริง (ขึ้นกับ §1 เสร็จก่อน): 1 วัน —
รวม **~3–4 วัน คนเดียว** ถ้า §1 (print engine) ทำเสร็จก่อนแล้ว

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

### 5.5 ประเมินขนาดงานคร่าว ๆ

Migration เพิ่ม `supplier_tax_id`: 0.5 วัน (รวมทดสอบ) · หา/ทำ company settings (ถ้ายังไม่มี): 0.5–1
วัน · endpoint + DTO ดึงข้อมูลสำหรับพิมพ์: 1 วัน · ฟอร์มพิมพ์ (ขึ้นกับ §1): 1 วัน — รวม **~3 วันคนเดียว**
ถ้า §1 เสร็จก่อนแล้ว ไม่รวมเวลาตรวจ `tax_configs` ว่าเก็บประเภทเงินได้ครบหรือยัง (§5.4)

---

## 6 · เอกสารที่แก้ไปแล้วระหว่างเขียน backlog นี้ (ไม่ใช่ backlog — ปิดแล้ว)

ระหว่างสำรวจเพื่อเขียนเอกสารนี้ พบ doc drift 1 จุดใน `srs-p6.html` §06 — บอกว่า "ทั้งระบบยังไม่มี
outbox" ทั้งที่ inventory-bc/finance-bc มี `OutboxService` จริงแล้ว (คนละปัญหากับที่ report-bc ไม่มี
consumer) แก้ note ให้ตรงกับโค้ดจริงแล้วในรอบเดียวกับที่เขียนเอกสารนี้ (ดู commit ของรอบ 2026-09-04)
