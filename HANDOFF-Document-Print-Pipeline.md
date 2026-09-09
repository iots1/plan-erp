# HANDOFF — Document Print Pipeline (ออกแบบ + แผนงาน)

> **เอกสารออกแบบของ product** — ไม่ใช่ session-tracking file แบบ `HANDOFF-Feature.md` · เก็บไว้จนกว่า
> งานในนี้จะทำเสร็จครบ แล้วค่อย archive เข้า `srs-p6.html`/`api-workflow-guide.html`
>
> เขียนเมื่อ **2026-09-06** ตามคำถามของผู้ใช้ 3 ข้อ:
> (1) flow การพิมพ์ควรเป็นยังไง — `quotation create → document_types → report-bc → print_templates + data → render`
> (2) ตอนพิมพ์ต้อง `POST` เก็บประวัติว่าใครพิมพ์เอกสารอะไรไหม
> (3) จำเป็นต้องบันทึก **data ณ ตอนพิมพ์** ไหม
>
> **อ่านคู่กับ**: `HANDOFF-Backlog-Reporting-Print-Tax.md` §1 (สถานะ as-is ของ print engine, ตรวจไว้
> 2026-09-04 — ยังถูกต้องทุกข้อ) · `srs-p6.html` §06 · `backend-convention.html`
>
> **สถานะ 2026-09-09: P0–P3 ✅ · P4 16/25 (ดู §7)** — พิมพ์ **ใบกำกับภาษีเต็มรูป** และ
> **ใบเสนอราคา** ออกมาเป็นเอกสารจริงหน้าตาใช้งานได้แล้ว (banded, ตารางรายการมีเส้น + filler,
> ยอดรวมแยก VAT, จำนวนเงินเป็นตัวอักษร, ลายน้ำ DRAFT, เลขหน้า/มีต่อหน้า) — ถัดไปคือ **P4**
> (ขยายอีก 23 ใบ) · ⚠️ **ตัวบล็อกที่เหลือไม่ใช่โค้ด**: `company_profiles` ของ deployment นี้ยังว่าง
> ทุกช่อง เอกสารทุกใบจึงพิมพ์โดยไม่มีชื่อ/เลขผู้เสียภาษี/ที่อยู่ผู้ขาย ซึ่ง §86/4(1)–(2) บังคับ —
> ต้องกรอกก่อนเอาไปใช้จริง (ดู §7.3)
>
> *(สถานะเดิม 2026-09-08: P0+P1+P2)* —
> `company_profiles`/`company_branches` (P0), `document_prints` + `report.printDocument` RPC (P1)
> และ `POST /quotations/:id/print` + `POST /receipts/:id/print` (P2 · commit `d8b472b`) ใช้งานได้จริง
> บนโปรดักชันแล้ว **พิมพ์เอกสารครบวงจรได้แล้ว 2 ใบ** — ถัดไปคือ **P3** (HTML จริงของ 2 ใบนั้นแทน
> draft placeholder + ย้ายจากเอนจิน `simple` → `banded` + ลายน้ำ DRAFT)
> ที่เหลือเปิดอยู่ 5 ข้อแต่ไม่บล็อก P3 (§8.2) · ข้อที่ต้องรอ**ฝ่ายบัญชี**คือเรื่อง
> ต้นฉบับ/สำเนา/ใบแทน (§6.2) ซึ่งไปโผล่ที่ P5 ปลายทาง
>
> ⚠️ **ตารางเฟสใน §7 เคยค้างที่ "P2 ⬜ ถัดไป" อยู่ 2 วันหลัง P2 ขึ้นโปรดักชันไปแล้ว** — doc-bump
> `10ab25d` อัปเดตแต่ `api-workflow-guide.html` (รายการ endpoint) ไม่ได้แตะตารางนี้ · เจอตอน audit
> 2026-09-08 ที่ไปอ่านโค้ดจริงเทียบ ไม่ใช่เจอจากตัวเอกสาร — **เฟสถัดไปที่ปิดงาน ให้แก้ตาราง §7 +
> บล็อกสถานะหัวไฟล์นี้ในคอมมิตเดียวกับโค้ด** ไม่ใช่รอ doc-bump รอบถัดไป

---

## 0 · สรุปคำตอบสั้น (TL;DR)

| คำถาม | คำตอบ | เหตุผลสั้นที่สุด |
|---|---|---|
| **(1)** Flow ตามที่คิดไว้ถูกไหม? | **ถูกเกือบหมด แต่กลับทิศหนึ่งจุด** — BC เจ้าของเอกสาร (sales-bc) เป็นคน**ประกอบ data เอง**แล้วส่งให้ report-bc ไม่ใช่ report-bc วิ่งไปดึงข้อมูลจาก BC อื่น | report-bc ที่ดึงข้อมูลเองต้องรู้จักทุก BC = report-bc ขึ้นกับทุกคน ผิดกฎ "BC เป็นเจ้าของข้อมูลตัวเอง" ของ root `CLAUDE.md` |
| **(2)** ต้อง POST เก็บประวัติการพิมพ์ไหม? | **ต้อง และเป็นตารางใหม่** `document_prints` — ตอนนี้**ไม่มีที่ไหนเก็บเลย** (`print_template_histories` ที่มีอยู่คือประวัติการ**แก้เทมเพลต** ไม่ใช่ประวัติการพิมพ์) | ใบกำกับภาษีต้องแยก **ต้นฉบับ / สำเนา / ใบแทน** ให้ได้ ซึ่งต้องรู้ว่าใบนี้เคยพิมพ์ไปแล้วกี่ครั้ง — ไม่มีตารางนี้ก็ตอบไม่ได้ |
| **(3)** ต้อง snapshot data ตอนพิมพ์ไหม? | **ต้อง — เก็บ `params` ที่ใช้ render จริง + เวอร์ชันเทมเพลตที่ใช้ + ไฟล์ PDF** | เทมเพลตแก้ได้และมีเวอร์ชัน (`print_template_histories`) → พิมพ์ใบเดิมซ้ำอีกปีถัดไปจะได้หน้าตาคนละแบบ ถ้าไม่ snapshot ไว้ก็**พิสูจน์ไม่ได้ว่าที่ยื่นให้ลูกค้าไปหน้าตาแบบไหน** |

**ตัวบล็อกที่ใหญ่ที่สุด ไม่ใช่เรื่อง flow**: ระบบ**ยังไม่มีข้อมูลผู้ประกอบการของเราเองอยู่เลยสักที่**
(ชื่อบริษัท / ที่อยู่ / เลขประจำตัวผู้เสียภาษี) — ตรวจแล้ว 2026-09-06 ไม่มีทั้ง entity, ทั้ง setting,
ทั้ง env (`grep company_tax_id|seller_tax_id|COMPANY_NAME` = 0 hit) ซึ่ง §86/4 **บังคับ**ให้ต้องมีบน
ใบกำกับภาษีทุกใบ → พิมพ์ใบกำกับที่ถูกกฎหมายไม่ได้เลยจนกว่าจะมีตารางนี้ ดู §6.1

---

## 1 · สถานะจริงวันนี้ (ตรวจโค้ด + DB จริง 2026-09-06)

### 1.1 มีอะไรแล้ว (มากกว่าที่คิด)

| ของ | สถานะ |
|---|---|
| `print_templates` | ✅ **25 แถวจริงในโปรดักชัน** — ครบทุกเอกสารในระบบ (สร้าง 2026-09-06) HTML เก็บบน MinIO ไม่ใช่ Postgres, มี versioning + restore |
| `document_types` | ✅ **25 แถว จับคู่ 1:1 กับ `print_templates` ด้วย `code` เดียวกัน** + `has_running_number`/`running_number_format` ครบทุกแถว (พรีฟิกซ์ตรงกับ `*NumberService` จริงของแต่ละ BC) |
| FK `document_types.print_template_id` | ✅ มีจริง (Postgres FK, ตารางเดียวกันใน `erp_report`) — **ตัวเลือกเทมเพลตอัตโนมัติพร้อมใช้แล้ว** |
| Render pipeline | ✅ `POST /report-bc/v1/print-templates/:id/render` → substitute `{{key}}` (หรือ banded paginate) → Gotenberg → upload storage → presigned URL (1 ชม.) |
| 2 เอนจิน | ✅ `simple` (แทนที่ตรง ๆ) + `banded` (แบ่งหน้าเองฝั่ง client, สำหรับเอกสารหลายหน้า) |
| ประวัติการ**แก้เทมเพลต** | ✅ `print_template_histories` (create/update/delete/restore + snapshot HTML ทุกเวอร์ชัน) |

### 1.2 ยังไม่มีอะไร (คือเนื้องานทั้งหมดของ handoff นี้)

1. **glue** — ไม่มีโค้ดสักบรรทัดที่รับ `document_id` แล้วแปลงเป็น `params` (ยืนยันอีกครั้ง 2026-09-06:
   `render()` รับ `params` จาก client ล้วน ๆ ไม่เคยไป fetch เอกสารจริงจาก BC ไหนเลย)
2. **ประวัติการพิมพ์** — ไม่มีตาราง ไม่มีคอลัมน์ ไม่มีอะไรเลย ไฟล์ PDF ที่ render แล้วลอยอยู่บน MinIO
   โดย**ไม่มีแถวไหนใน Postgres ชี้ถึงมัน** (ไม่รู้ว่าไฟล์ไหนของเอกสารใบไหน ใครสั่งพิมพ์ ตอนไหน)
3. **RPC เข้า report-bc** — `AppMicroservice.Report.cmd` มีแต่ `InventoryEventResources`
   (`expiry.approaching`/`stock.low`) **ไม่มี cmd สำหรับสั่งพิมพ์เลย** ต้องเพิ่มใหม่
4. **ข้อมูลผู้ประกอบการ (ผู้ออกเอกสาร)** — ไม่มีอยู่จริงในระบบ (ดู §6.1 — นี่คือ blocker ตัวจริง)
5. **HTML จริง** — 25 เทมเพลตที่สร้างไว้ยังเป็น draft placeholder ทุกใบ (ตั้งใจ รอออกแบบจริง)

---

## 2 · Flow ที่แนะนำ — ใครเรียกใคร

### 2.1 ภาพรวม

```
[FE]  POST /sales-bc/v1/quotations/{id}/print   { locale?: 'th'|'en' }
        │
        │  ① sales-bc เป็นเจ้าของข้อมูล → โหลด quotation + items + customer snapshot ของตัวเอง
        │     ประกอบเป็น params ตาม schema ของเทมเพลต
        ▼
[sales-bc] ── RPC: report.printDocument ──▶ [report-bc]
             {                                   │
               document_type_code: 'quotation_standard',
               source_bc: 'sales-bc',             │  ② หา document_types by code
               source_document_id: <uuid>,        │     → print_template_id (FK มีอยู่แล้ว)
               source_document_number: 'QT-2026-00042',
               params: { ... },                   │  ③ merge company_profile เข้า params ให้อัตโนมัติ
               idempotency_key?: <uuid>           │     (BC ผู้เรียกไม่ต้องรู้เรื่องนี้ — ดู §6.1)
             }                                    │
                                                  │  ④ render → Gotenberg → PDF → upload storage
                                                  │  ⑤ INSERT document_prints  ← ประวัติ + snapshot
                                                  │     (คำนวณ copy_number ต้นฉบับ/สำเนา ที่นี่)
                                                  ▼
             ◀── { print_id, url, copy_number, is_original } ──
```

### 2.2 ทำไมให้ BC เจ้าของเอกสารเป็นคนประกอบ `params` (ไม่ใช่ report-bc ไปดึงเอง)

- **ถูกตามกฎ boundary ที่มีอยู่แล้ว** — root `CLAUDE.md` + `.claude/rules/module-boundaries.md`:
  ข้อมูลเป็นของ BC เจ้าของ คนอื่นขอผ่าน service/RPC ของเจ้าของเท่านั้น
- **ถ้ากลับทิศ report-bc จะขึ้นกับทุก BC** — ต้องมี `ClientProxy` ไปหา sales/supplier/finance/inventory
  ครบทุกตัว + ต้องรู้ shape ของทุกเอกสาร → report-bc กลายเป็นจุดที่ deploy ไม่ได้ถ้า BC ไหนพัง
  (ตอนนี้ report-bc เรียกออกแค่ **storage-bc** ตัวเดียว — รักษาสภาพนี้ไว้ดีกว่า)
- **สิทธิ์อยู่ถูกที่** — คนที่ดูใบเสนอราคาได้ควรเป็นคนพิมพ์ได้ → `@RequirePermission('quotation:print')`
  อยู่บน endpoint ของ sales-bc ตรงจุดที่ระบบสิทธิ์ทำงานอยู่แล้ว ไม่ต้องยกสิทธิ์ทั้งชุดไปไว้ที่ report-bc
- **ข้อแลกเปลี่ยนที่ยอมรับ**: BC ละชุดต้องเขียน mapper ของตัวเอง (~80–120 บรรทัดต่อเอกสาร) —
  ยอมรับได้ เพราะแต่ละเอกสารมี field/กฎการแสดงผลไม่เหมือนกันอยู่แล้ว (VAT bucket, WHT, ส่วนลดต่อบรรทัด)

### 2.3 ทางเลือกที่พิจารณาแล้ว**ไม่**เลือก

| ทางเลือก | ทำไมไม่เอา |
|---|---|
| report-bc ดึงข้อมูลเองข้าม BC | ผูก report-bc เข้ากับทุก BC (§2.2) |
| FE ประกอบ `params` เองแล้วยิง `/render` ตรง | ไม่มีใครรับประกันว่าเลขบน PDF ตรงกับใน DB — เท่ากับพิมพ์เอกสารภาษีจากตัวเลขที่ client แก้ได้ |
| ผูก `document_type_id` ลงบน `print_templates` | ทิศกลับด้าน: 1 เทมเพลตอาจใช้กับหลาย document type ได้ (เช่น 4 ชนิดย่อยของใบเสนอราคา) — FK ที่มีอยู่ (`document_types.print_template_id`) ทิศถูกแล้ว |

---

## 3 · ต้อง snapshot data ตอนพิมพ์ไหม → **ต้อง** (4 เหตุผล)

1. **เทมเพลตแก้ได้และมีเวอร์ชัน** — `print_templates` มี `current_version` + ประวัติครบ ถ้าปีหน้า admin
   แก้เลย์เอาต์แล้วมีคนกดพิมพ์ใบกำกับปีนี้ซ้ำ จะได้ PDF หน้าตาคนละแบบกับที่ลูกค้าถืออยู่ — ถ้าไม่บันทึก
   `print_template_version` ไว้ ก็**ย้อนกลับไปสร้างใบเดิมไม่ได้อีกเลย**
2. **กฎหมายให้เก็บสำเนา** — ใบกำกับภาษีต้องเก็บสำเนาไว้ (ปกติ 5 ปี, ขยายได้ถึง 7 ปีตามที่เจ้าพนักงาน
   ประเมินสั่ง) การเก็บ "ไฟล์ PDF ที่ออกไปจริง + input ที่ใช้สร้าง" ตอบโจทย์นี้ตรง ๆ กว่าการหวังว่า
   re-render ใหม่แล้วจะได้เหมือนเดิม
3. **เอกสารที่ยังแก้ได้ก็พิมพ์ได้** — ใบเสนอราคา/ใบแจ้งหนี้ชั่วคราว (`PROFORMA_INVOICE`) และเอกสาร
   สถานะ `DRAFT` ทุกชนิด ยังแก้ตัวเลขได้หลังพิมพ์ → ตัวเอกสารใน DB วันนี้ ≠ สิ่งที่ยื่นให้ลูกค้าไปเมื่อวาน
   (เอกสาร `ISSUED` แม้จะ immutable แล้ว แต่ก็ไม่ครอบคลุมกรณีนี้)
4. **บาง field ไม่ได้อยู่บนเอกสาร** — ข้อมูลผู้ประกอบการ, ข้อความ "จำนวนเงินเป็นตัวอักษร",
   คำว่า *ต้นฉบับ/สำเนา*, ชื่อผู้พิมพ์ — พวกนี้เกิดตอน render ไม่ได้เก็บอยู่บน `quotations`/`receipts`

**ขอบเขตที่ควร snapshot (ไม่ใช่ dump ทุกอย่าง)**: เก็บ **`params` ที่ส่งเข้า render จริง** พอ —
ไม่ต้อง copy ทั้ง entity ลงมา เพราะ `source_document_id` ชี้กลับไปหาต้นฉบับได้อยู่แล้ว และการเก็บซ้ำ
ทั้งก้อนจะกลายเป็นข้อมูลชุดที่สองที่ไม่มีใคร sync

---

## 4 · Schema ที่เสนอ — `document_prints` (erp_report)

```ts
@Entity({ name: 'document_prints', database: ErpDatabases.REPORT })
@Index('idx_document_prints_source', ['source_bc', 'source_document_id'])
@Index('idx_document_prints_document_type_id', ['document_type_id'])
@Unique('uq_document_prints_idempotency_key', ['idempotency_key'])   // nullable → กันกดซ้ำ
export class DocumentPrint extends BaseEntity {
  document_type_id: string;          // FK → document_types.id (ตารางเดียวกัน มี FK จริง)
  print_template_id: string;         // FK → print_templates.id — เทมเพลตที่ใช้ ณ ตอนนั้น
  print_template_version: number;    // เวอร์ชันที่ใช้จริง ← กุญแจของการย้อนสร้างใหม่ (§3 ข้อ 1)

  source_bc: string;                 // 'sales-bc' | 'finance-bc' | ... (ข้าม BC ไม่มี FK จริง)
  source_document_id: string;        // uuid ของเอกสารต้นทาง
  source_document_number: string | null;  // snapshot เลขที่เอกสาร ณ ตอนพิมพ์ (DRAFT ยังไม่มีเลข = null)

  copy_number: number;               // 1 = ต้นฉบับ, 2+ = สำเนา/ใบแทน (นับต่อ source_document_id)
  is_original: boolean;              // copy_number === 1 — ทำให้ query "ใครเคยได้ต้นฉบับ" ตรง ๆ

  params: Record<string, unknown>;   // jsonb — input ที่ใช้ render จริง (§3)
  locale: string;                    // 'th' | 'en' — ใบเดียวกันคนละภาษาถือเป็นคนละครั้งพิมพ์

  bucket: string;                    // ไฟล์ PDF ที่ออกไปจริง
  path: string;
  file_size: number;
  file_hash: string | null;          // sha256 — พิสูจน์ว่าไฟล์ไม่ถูกแก้ภายหลัง

  printed_by: string;                // uuid ผู้สั่งพิมพ์ (จาก _context ของ RPC)
  printed_at: Date;                  // timestamptz
  print_reason: string | null;       // เหตุผล — บังคับกรอกเมื่อเป็นใบแทน (§6.2)
}
```

**หมายเหตุต่อคอลัมน์ที่ตัดสินใจไว้แล้ว**

- **`created_by`/`created_at` จาก `BaseEntity` ไม่พอ** จึงมี `printed_by`/`printed_at` แยก — เพราะแถวนี้
  อาจถูกสร้างโดย service (system) แทนผู้ใช้จริงในอนาคต (เช่น พิมพ์อัตโนมัติตอน issue) การแยกไว้ทำให้
  "ใครกดพิมพ์" ไม่ปนกับ "แถวนี้ถูกเขียนโดยอะไร"
- **`copy_number` คำนวณฝั่ง server เท่านั้น** ด้วย `SELECT ... FOR UPDATE` / unique
  `(source_document_id, copy_number)` ในทรานแซกชันเดียวกับการ insert — ห้ามให้ client ส่งมา
- **`idempotency_key`** — FE กดปุ่มพิมพ์รัว ๆ ไม่ควรกลายเป็น "ต้นฉบับ 1 ใบ + สำเนา 3 ใบ" ในรายงานภาษี
- **`params` เป็น `jsonb`** ตามแนวเดียวกับ `print_template_histories.snapshot` ที่ใช้อยู่แล้ว
- **retention**: object ของ PDF ต้อง**ห้ามลบอัตโนมัติ** (ต่างจากไฟล์ preview) — ต้องตรวจ lifecycle
  policy ของ MinIO ก่อนขึ้นใช้จริง

---

## 5 · API ที่เสนอ

### 5.1 report-bc (ผู้ให้บริการ)

| ทาง | สัญญา | หมายเหตุ |
|---|---|---|
| **RPC** `report.printDocument` | เพิ่มเข้า `AppMicroservice.Report.cmd` (ตอนนี้ยังไม่มี) | ทางหลัก — BC อื่นเรียกทางนี้ |
| `GET /report-bc/v1/document-prints` | ประวัติการพิมพ์ทั้งระบบ + filter ตาม `source_document_id` | สิทธิ์ `document_print:view` |
| `GET /report-bc/v1/document-prints/:id` | รายละเอียด + presigned URL ของ PDF ที่พิมพ์ครั้งนั้น | ออก URL ใหม่ได้เรื่อย ๆ โดยไม่นับเป็นการพิมพ์ซ้ำ |

**สำคัญ**: การขอ URL ของไฟล์เดิมซ้ำ **ไม่ใช่**การพิมพ์ครั้งใหม่ — ไม่เพิ่ม `copy_number`
(ไม่งั้นแค่รีเฟรชหน้าจอก็กลายเป็นออกสำเนาเพิ่ม)

### 5.2 BC เจ้าของเอกสาร (ผู้เรียก) — รูปแบบเดียวกันทุกใบ

```
POST /sales-bc/v1/quotations/:id/print          @RequirePermission('quotation:print')
POST /finance-bc/v1/receipts/:id/print          @RequirePermission('receipt:print')
POST /supplier-bc/v1/purchase-orders/:id/print  @RequirePermission('purchase_order:print')
...
```

แต่ละตัวทำ 3 อย่าง: โหลดเอกสารของตัวเอง → เรียก mapper (`toPrintParams()`) → `sendWithContext` ไป
report-bc แล้วส่ง `{ url, copy_number }` กลับให้ FE

**mapper อยู่ที่ไหน**: `apps/<bc>/src/modules/<doc>/utils/<doc>-print-params.util.ts` — เป็น pure
function เทสต์ง่าย และเป็นจุดเดียวที่รู้ว่า field ไหนไปโผล่ตรงไหนบนกระดาษ

---

## 6 · ตัวบล็อกที่ต้องตัดสินใจก่อนเริ่มเขียนโค้ด

### 6.1 🔴 ข้อมูลผู้ประกอบการ (ผู้ออกเอกสาร) — **ไม่มีอยู่จริงในระบบเลย** ✅ *ตัดสินใจแล้ว 2026-09-06*

ตรวจ 2026-09-06: ไม่มี entity/setting/env ไหนเก็บ **ชื่อบริษัท · ที่อยู่ · เลขประจำตัวผู้เสียภาษี ·
สาขา · โลโก้** ของเราเองเลย แต่ §86/4 บังคับให้ใบกำกับภาษีต้องมีครบทุกข้อ (รวม "สำนักงานใหญ่/สาขาที่ ...")
→ **พิมพ์ใบกำกับภาษีที่ใช้ได้ตามกฎหมายไม่ได้จนกว่าจะมีตารางนี้**

> ### ✅ ตัดสินใจแล้ว (ผู้ใช้, 2026-09-06)
> - **เก็บที่ `finance-bc`** — เลขผู้เสียภาษีเป็น "ตัวตนทางภาษี" ซึ่ง finance-bc เป็นเจ้าของอยู่แล้ว
>   (`tax_configs`, ภ.พ.30, WHT) และจะถูกใช้ซ้ำตอนทำฟอร์ม ภ.พ.30 / หนังสือรับรองหัก ณ ที่จ่าย
> - **บริษัทเดียว + หลายสาขา** — ไม่ทำ multi-tenant (ระบบวันนี้ไม่มี `company_id` บนตารางไหนเลย
>   การใส่เข้าไปหมายถึงแตะทุกเอกสาร/ทุกเลขที่รัน/ทุก counter)
> - **report-bc เป็นคน merge เข้า `params` เอง** (ดึงผ่าน RPC + cache ใน Redis) — BC ผู้เรียกส่งมา
>   แค่ข้อมูลเอกสารของตัวเอง ไม่ต้องรู้จัก company profile

**Schema ที่ตามมาจากการตัดสินใจนี้** (finance-bc, `erp_finance`):

```ts
// 1 แถวเท่านั้น — singleton pattern เดียวกับ finance_settings ที่มีอยู่แล้ว
@Entity({ name: 'company_profiles', database: ErpDatabases.FINANCE })
export class CompanyProfile extends BaseEntity {
  name_th: string;  name_en: string;
  tax_id: string;                 // เลขประจำตัวผู้เสียภาษี 13 หลัก
  address_th: string;  address_en: string;
  phone: string | null;  email: string | null;
  logo_bucket: string | null;  logo_path: string | null;   // เก็บบน storage เหมือน print_templates
}

// สาขา — ใบกำกับต้องระบุ "สำนักงานใหญ่" หรือ "สาขาที่ xxxxx" (§86/4)
@Entity({ name: 'company_branches', database: ErpDatabases.FINANCE })
@Unique('uq_company_branches_branch_code', ['branch_code'])
export class CompanyBranch extends BaseEntity {
  branch_code: string;            // '00000' = สำนักงานใหญ่ ตามรูปแบบกรมสรรพากร
  name_th: string;  name_en: string;
  address_th: string;  address_en: string;
  is_head_office: boolean;
  is_active: boolean;
}
```

**ยังต้องตัดสินใจต่อ (ระดับ implement ไม่บล็อก P0)**: เอกสารแต่ละใบรู้ได้ยังไงว่าออกจาก *สาขาไหน* —
ทางที่เบาที่สุดคือ default เป็นสำนักงานใหญ่ก่อน แล้วค่อยเพิ่ม `branch_id` บนเอกสารตอนที่ธุรกิจมีสาขาจริง
(ผูกกับ `warehouse` หรือกับ user ก็ได้ — ยังไม่ต้องตัดสินใจตอนนี้)

### 6.2 ต้นฉบับ / สำเนา / ใบแทน — ต้องยืนยันกับฝ่ายบัญชี

- ใบกำกับภาษี**ต้นฉบับ**ให้ผู้ซื้อ, สำเนาเก็บไว้เอง — เอกสารที่พิมพ์ครั้งที่ 2+ ต้องมีคำว่า **"สำเนา"**
- กรณีลูกค้าทำต้นฉบับหาย ต้องออก **"ใบแทนใบกำกับภาษี"** (ป.รัษฎากร §86/12 + ประกาศอธิบดีฯ) ซึ่งต้อง
  มีข้อความระบุว่าเป็นใบแทน + อ้างอิงเลขที่/วันที่ของใบเดิม + **บันทึกไว้ในรายงานภาษีขาย**
- ⇒ ที่ schema ออกแบบไว้ (`copy_number`, `is_original`, `print_reason`) รองรับได้ แต่ **ข้อความที่ต้อง
  พิมพ์จริงและเงื่อนไขว่าเมื่อไหร่นับเป็น "สำเนา" vs "ใบแทน" ต้องให้ฝ่ายบัญชียืนยัน** ก่อน implement
  (อย่าเดาเอง — ผิดแล้วเป็นเอกสารภาษีที่ใช้ไม่ได้)

### 6.3 เอกสารที่ยัง `DRAFT` ให้พิมพ์ได้ไหม ✅ *ตัดสินใจแล้ว 2026-09-06*

> ### ✅ ตัดสินใจแล้ว (ผู้ใช้, 2026-09-06)
> **พิมพ์ได้ + บังคับลายน้ำ "ฉบับร่าง / DRAFT"** และ **ไม่นับเป็น `copy_number`**
> (เอกสารที่ยังไม่มีเลขที่ = ยังไม่มีผลทางภาษี จึงไม่มีทั้งต้นฉบับและสำเนา)

ผลต่อ implement:
- `document_prints` **ยังบันทึกแถวตามปกติ** (ต้องรู้ว่าใครเคยส่งฉบับร่างอะไรออกไป) แต่ตั้ง
  `copy_number = 0`, `is_original = false` — แยกออกจากลำดับต้นฉบับ/สำเนาโดยสิ้นเชิง
- report-bc เป็นคนเติมลายน้ำ **ฝั่ง server** (merge `is_draft: true` เข้า `params` เมื่อ
  `source_document_number` เป็น `null`) — ไม่ปล่อยให้ BC ผู้เรียกหรือ FE เป็นคนตัดสิน เพราะถ้าลืมส่ง
  ธงมา ฉบับร่างจะพิมพ์ออกมาหน้าตาเหมือนเอกสารจริง
- เทมเพลตทุกใบต้องมี CSS ลายน้ำที่ผูกกับธงนี้ (ทำครั้งเดียวใน layout ร่วม ไม่ต้องเขียนซ้ำ 25 ใบ)

---

## 7 · แผนงานเป็นเฟส

*(ขอบเขตด้านล่างล็อกตามการตัดสินใจ 2026-09-06 แล้ว)*

| เฟส | ขอบเขต | ประมาณ | สถานะ |
|---|---|---|---|
| **P0** | `company_profiles` + `company_branches` ใน **finance-bc** (entity + migration + CRUD + สิทธิ์ + seed สำนักงานใหญ่ `00000`) | 0.5–1 วัน | ✅ **เสร็จ + deploy แล้ว 2026-09-06** |
| **P1** | `document_prints` + `report.printDocument` RPC + resolve เทมเพลตผ่าน `document_types` (เพิ่ม `findByCode()`) + `copy_number` (0 สำหรับ DRAFT, `SELECT...FOR UPDATE` กันชนกัน) + snapshot `params` + ดึง/cache company profile ผ่าน RPC ใหม่ `finance.getCompanyProfile` + ธง `is_draft` + `idempotency_key` + `GET /document-prints` | 1.5–2 วัน | ✅ **เสร็จ + deploy แล้ว 2026-09-06** — ดู §7.1 |
| **P2** | endpoint `POST /:id/print` + mapper ของ **ใบกำกับภาษีเต็มรูป** (finance-bc) และ **ใบเสนอราคา** (sales-bc) | 1–1.5 วัน | ✅ **เสร็จ + deploy แล้ว 2026-09-06** (commit `d8b472b`) — ดู §7.2 |
| **P3** | HTML จริงของ 2 ใบนั้น (แทน draft placeholder) + layout ร่วมที่มีลายน้ำ DRAFT — ใช้เอนจิน `banded` สำหรับรายการยาวข้ามหน้า | 1–2 วัน | ✅ **เสร็จ 2026-09-09** (เทมเพลตอยู่ที่ v3 บนโปรดักชัน) — ดู §7.3 |
| **P4** | ขยายให้ครบ 25 เอกสาร (mapper + HTML ทีละใบ) | ~0.5 วัน/ใบ | 🟡 **16/25 แล้ว 2026-09-09** — receipt 8 + quotation 4 (ที่มี endpoint อยู่แล้ว) + **purchase order 4 (endpoint ใหม่)** · อีก 9 ใบยังไม่มี `POST /:id/print` — ดู §7.4 |
| **P5** | ใบแทน/สำเนา ตามข้อสรุป §6.2 + ฟอร์ม ภ.พ.30 (`HANDOFF-Backlog-Reporting-Print-Tax.md` §4.4 ข้อ 4) | 1–2 วัน | ⬜ รอคำตอบฝ่ายบัญชี |

**ทำ P0→P3 ก่อนแล้วหยุดรีวิว** — จะได้เห็นของจริง 2 ใบพิมพ์ออกมาได้ก่อนลงทุนทำอีก 23 ใบ
(รวม P0–P3 ≈ **4–6 วัน**, ใช้ไปแล้ว P0+P1+P2 — เหลือแค่ P3 ก่อนถึงจุดหยุดรีวิว)

### 7.1 ผลตรวจสอบ P1 — 2026-09-06 ✅ **implement + migrate + deploy แล้ว**

**สิ่งที่เพิ่มเข้าไปนอกเหนือจาก schema ที่ร่างไว้ใน §4**:
- `DocumentTypesService.findByCode()` — ของเดิมมีแค่ `findById()` (โดย uuid) ไม่มีค้นด้วย `code` เลย
  ซึ่ง RPC ต้องใช้ `code` เป็น natural key (BC ผู้เรียกรู้แค่ `document_type_code`, ไม่รู้ uuid)
- `libs/common/src/interfaces/`: `ICompanyProfileLookupResult`, `IPrintDocumentRequest`,
  `IPrintDocumentResult` — คู่กับ `AppMicroservice.Finance.cmd.CompanyProfileResources
  .GetCompanyProfile` และ `AppMicroservice.Report.cmd.PrintDocumentResources.PrintDocument`
  ที่เพิ่มใหม่ (ตามแบบ `ReceiptResources`/`InventoryEventResources` ที่มีอยู่แล้ว)
- `CompanyProfileProxyService` (report-bc → finance-bc) — cache 5 นาทีผ่าน `sendWithContext`'s
  built-in Redis cache (ข้อมูลนี้แทบไม่เปลี่ยน)
- **`file_hash` (SHA-256) ตั้งใจเลื่อนออกไป** — เก็บ `null` ก่อน เพื่อไม่ต้องแก้ return shape ของ
  `PrintTemplatesService.render()` ที่ deploy จริงอยู่แล้ว (ยังไม่มี hash ให้ใช้จากตรงนั้น)

**ตรวจแล้ว**: unit test ใหม่ 7 ตัวผ่านหมด (`copy_number`/`is_original` ทั้ง 3 เคส, merge company
profile ทั้ง fallback, กันซ้ำด้วย `idempotency_key`) · `nest build report-bc`/`finance-bc` ผ่าน ·
migration (`document_prints` + FK จริงไปหา `document_types`/`print_templates`) รันแล้ว, `migration:generate` = `No changes` · permission ใหม่ `document_print:view` sync + grant แล้ว ·
commit + push + deploy สำเร็จ · `GET /report-bc/v1/document-prints` ยืนยันแล้วบนโปรดักชัน (ตอบ
`200` ว่างเปล่า ถูกต้องเพราะยังไม่มี P2 มาเรียก RPC จริง)

**ยังไม่ได้ยิง E2E ผ่าน RMQ จริง** *(ปิดแล้วที่ P2 — smoke ทั้งสองไฟล์ใน §7.2 เดินสายจริงครบวงจร)* — `report.printDocument` เป็น request/reply ผ่าน RabbitMQ
ไม่มีทางยิงผ่าน HTTP ได้ตรง ๆ (ต่างจาก REST endpoint) และตอนนี้ยังไม่มี BC ไหนเรียกจริง (รอ P2) —
ตรรกะทั้งหมดตรวจผ่าน unit test แล้ว แต่การเดินสายจริงผ่าน RMQ (คิว → ack → reply) จะพิสูจน์ได้ครั้ง
แรกก็ตอน P2 มี endpoint จริงมาเรียก ไม่ใช่ก่อนหน้านั้น — เขียน mock caller แยกตอนนี้เท่ากับพิสูจน์แค่
transport เดิมของ NestJS ที่ proxy-service คู่อื่นในระบบพิสูจน์ไว้แล้วซ้ำอีกรอบ ไม่ได้พิสูจน์อะไรใหม่

### 7.2 ผลตรวจสอบ P2 — 2026-09-06 ✅ **implement + deploy แล้ว** (commit `d8b472b`, 27 ไฟล์)

`POST /sales-bc/v1/quotations/:id/print` (`quotation:print`) และ
`POST /finance-bc/v1/receipts/:id/print` (`receipt:print`) — body เป็น optional ทั้งคู่
(`locale` / `idempotency_key` / `print_reason`)

**สิ่งที่ต่างจากที่ร่างไว้ (ไม่ใช่แค่ทำตามแผน)**:
- **ครอบทุก `document_type` ของสองเอกสารนั้น ไม่ใช่แค่ 2 แบบ** — แผน §8.1 ข้อ 4 เขียนว่า "ใบกำกับ
  ภาษีเต็มรูป + ใบเสนอราคา" แต่การ resolve เทมเพลตทำเป็น**ตาราง map** จึงได้ครบในราคาเดียวกัน:
  `RECEIPT_PRINT_DOCUMENT_TYPE_CODE` (8 ค่า → `receipt_plain` … `receipt_debit_note`) และ
  `QUOTATION_PRINT_DOCUMENT_TYPE_CODE` (4 ค่า → `quotation_standard` … `quotation_tender`) ·
  เก็บ map ไว้ที่ BC เจ้าของเอกสาร ไม่ใช่เดา `code` ที่จุดเรียก — เปลี่ยนชื่อ code ทีหลังแก้ที่เดียว
- **`toPrintParams()` เป็น pure function แยกไฟล์** (`receipt-print-params.util.ts` /
  `quotation-print-params.util.ts`) ไม่ได้อยู่ใน service — mapping "ฟิลด์ไหนไปโผล่ตำแหน่งไหนบนใบพิมพ์"
  ทดสอบได้โดยไม่ต้องมี DB (unit spec 113 + 107 บรรทัด)
- **`items_text` เป็นของชั่วคราวที่ P3 ต้องรื้อ** — เทมเพลตทุกใบยังเป็น draft placeholder
  (`template_engine: 'simple'`) ซึ่งแทนค่า `{{key}}` แบน ๆ และ**วนซ้ำต่อบรรทัดไม่ได้** จึงยัดรายการ
  สินค้าเป็นข้อความหลายบรรทัดก้อนเดียวไปก่อน · P3 ที่ย้ายไป `banded` คือจุดที่ตารางบรรทัดจริงมาแทน
- **การพิมพ์ไม่ใช่ state transition** — `print()` ไม่แตะแถวของเอกสารเลย (ต่างจาก `issue()`/`void()`) ·
  `document_number` ของใบ `DRAFT` เป็น `null` แล้วส่งผ่านตรง ๆ — นั่นคือสัญญาณที่ report-bc ใช้บังคับ
  ลายน้ำ DRAFT + `copy_number: 0` (§6.3) ไม่ใช่สิ่งที่ BC ผู้เรียกตัดสินใจเอง
- **`null` จาก proxy = 503 ไม่ใช่ผลลัพธ์ว่าง** — `PrintDocumentProxyService` ใช้ `sendWithContext`
  แบบ no-throw ตามแบบ proxy ตัวอื่นทั้งระบบ แล้ว service ชั้นบนแปลงเป็น `ServiceUnavailableException`

**ตรวจแล้ว**: unit spec ใหม่ทั้ง mapper และ `print()` (resolve `copy_number`, DRAFT passthrough,
503 เมื่อ report-bc ไม่ตอบ) · e2e-spec ทั้งสอง controller — รวม `receipts.e2e-spec.ts` ซึ่งเป็น
**ครั้งแรกที่ `ReceiptsController` มี e2e harness เลย** · migration `erp_iam`
`1788701251784-GrantQuotationAndReceiptPrintPermissionsToMockPolicies` (รัน `permissions:sync` ก่อน
ตามกฎลำดับ deploy ใน `.claude/rules/permissions.md`) — รอบ verify 2026-09-08 รายงาน `erp_iam`
pending 0 ยืนยันว่ารันบน DB จริงแล้ว

**smoke 2 ไฟล์ = จุดที่พิสูจน์ของจริง** (`apps/finance-bc/test/smoke/receipts-print.smoke.mjs`,
`apps/sales-bc/test/smoke/quotations-print.smoke.mjs`) — เดินครบสาย: AuthGuard/PermissionGuard จริง →
RMQ round trip ไป `report.printDocument` → report-bc RPC กลับมาถาม company profile ที่ finance-bc →
Gotenberg render จริง → อัปโหลดผ่าน storage จริง → แถว `document_prints` จริงใน `erp_report` ·
ประกาศ `needs: ['report-bc', 'storage']` ไว้ ไม่งั้นทั้งสองตัวล่มแล้ว endpoint ตอบ 503 และเทสที่มีไว้
พิสูจน์ pipeline จะกลายเป็นพิสูจน์ว่าไม่มีอะไรทำงาน · ทั้งสองไฟล์ใช้เอกสารที่มีอยู่แล้วในคลัสเตอร์
(ไม่สร้างใหม่) เพราะการพิมพ์ไม่แก้เอกสาร — สถานะที่หยิบได้ (DRAFT หรือ ISSUED) พา `claimCopyNumber()`
ไปคนละกิ่ง และ assert ไว้ทั้งสองกิ่ง

### 7.3 ผลตรวจสอบ P3 — 2026-09-09 ✅ **เทมเพลตจริง 2 ใบ ใช้งานได้บนโปรดักชัน**

**สิ่งที่ส่งมอบ**: `receipt_full_tax_invoice` + `quotation_standard` เป็น `template_engine: 'banded'`
เวอร์ชัน 3 (v1 = P0 placeholder, ยัง restore ได้จาก version history) · ต้นฉบับที่เขียนไว้อยู่ใน repo ที่
`apps/report-bc/src/modules/print-template/assets/templates/` พร้อม `_README.md` ที่บอกว่า **แหล่งความ
จริงคือแถวใน `print_templates`** ไม่ใช่ไฟล์ — ไฟล์มีไว้ให้ review ใน PR และ apply ซ้ำกับ deployment ใหม่
(อัปโหลดผ่าน `PUT /print-templates/:id` ซึ่งเขียนไฟล์ลง MinIO ให้เองอยู่แล้ว ไม่ต้องมีกลไก seed ใหม่)

**mapper เปลี่ยนสัญญา**: `toPrintParams()` ทั้งสองฝั่งเลิกส่ง `items_text` (ข้อความก้อนเดียว) เปลี่ยนเป็น
`items[]` ที่มีคีย์ `items` เป๊ะ ๆ เพราะ paginator วนจาก `D.items` โดยตรง · **ทุกค่าถูก format มาแล้วจาก
ฝั่ง BC** เพราะ in-page renderer ไม่มี filter/locale/rounding เลย — เลขดิบจะพิมพ์ออกมาเป็น `1234.5`
บนใบกำกับภาษี · เพิ่ม `formatAmount()` (ไม่มีรหัสสกุลนำหน้า สำหรับคอลัมน์เงิน), `formatQuantity()`,
`formatDiscountLabel()` (พิมพ์ "10%" ไม่ใช่จำนวนเงินที่คำนวณได้แล้ว) และ `toThaiBahtText()` (บาทถ้วน/
สตางค์ · กฎ สิบ/ยี่สิบ/เอ็ด ครบ, `เอ็ด` เป็นกฎภายในกลุ่มล้าน) ใน `@lib/common`

**ลายน้ำ DRAFT เป็นสตริง ไม่ใช่ flag**: engine ไม่มี conditional เลย `{{#if}}` จึงทำไม่ได้ — report-bc
เติม `draft_watermark_text` เป็นข้อความจริงเมื่อเอกสารยังไม่มีเลข และเป็น `''` เมื่อออกเลขแล้ว
เทมเพลตพิมพ์มันทุกครั้งโดยไม่ต้องตัดสินใจอะไร

**บั๊กจริง 3 ตัวที่เจอระหว่างทาง** (ไม่มีอันไหน unit test จับได้):

1. **paginator หา `tbody`/`thead` แบบไม่ scope** — `page.querySelector('tbody')` เจอตารางใน
   band `page-header` ก่อน (ที่นี่คือตารางเลขที่/วันที่เอกสาร) แถวสินค้าทุกแถวจึงถูกยัดเข้าไปใน
   **หัวเอกสาร** และตารางรายการจริงเหลือแต่หัวคอลัมน์ลอยอยู่ท้ายหน้า — หน้าออกมาเละแต่ **ไม่ error**
   ปัญหานี้แฝงมาตั้งแต่เขียน engine เพราะไม่เคยมีเทมเพลตจริงที่มีตารางในหัวกระดาษ · แก้เป็น
   `page.querySelector('.rp-box thead' / '.rp-box tbody')` = engine แตะเฉพาะกล่องที่ตัวเองสร้าง
2. **`quotations-print.smoke.mjs` ไม่ได้ประกาศ `needs`** — commit `3f796d6` เติมให้ receipts-print
   กับ gl-accounts แต่ตกไฟล์นี้ · `pnpm verify sales-bc` จึงพิมพ์ใส่ report-bc ที่ไม่ได้สตาร์ท แล้วได้
   503 ที่อ่านเหมือน sales-bc พัง ตรงกับกับดักที่ root `CLAUDE.md` เตือนไว้เป๊ะ · เพิ่ม
   `needs: ['report-bc', 'storage', 'finance-bc']` — **finance-bc อยู่ในนั้นเพื่อ report-bc** ไม่ใช่
   เพื่อ sales-bc: report-bc ไป RPC ขอ company profile จาก finance-bc และถ้า finance-bc ล่ม
   **การพิมพ์ยังสำเร็จแต่ได้เอกสารที่ไม่มีตัวตนผู้ออก** — ผิดเงียบ ๆ ไม่ใช่ล้ม
3. **`mergeParams()` ให้ผู้เรียก override ตัวตนผู้ออกเอกสารได้** — `...params` ถูก spread ทีหลัง
   คีย์ `company_*`/`is_draft` ที่เซิร์ฟเวอร์เติม · BC ไหนก็ส่ง `company_tax_id` ของตัวเองมาทับได้ และ
   ส่ง `draft_watermark_text: ''` เพื่อพิมพ์ร่างแบบไม่มีลายน้ำได้ · สลับลำดับให้คีย์ที่เซิร์ฟเวอร์เป็น
   เจ้าของชนะเสมอ (ข้อมูลเอกสารของผู้เรียกยังเป็นของผู้เรียกทั้งหมด — สองชุดนี้ไม่ทับกันเลยในทุกเทมเพลต)

**ช่องว่างที่ต้องเติมก่อนใช้จริง (ไม่ใช่บั๊ก)**:

- 🔴 **`company_profiles` ว่างทุกช่อง** — `getOrCreate()` ของ P0 จงใจสร้างแถวเปล่าที่ผิดแบบเห็นชัด
  แทนที่จะเดาค่า ตอนนี้ยังไม่มีใครกรอก · เอกสารทุกใบจึงพิมพ์โดยไม่มีชื่อ/เลขผู้เสียภาษี/ที่อยู่ผู้ขาย
  ซึ่ง §86/4(1)–(2) บังคับ · smoke ทั้งสองไฟล์ log คำเตือนนี้ทุกครั้งจนกว่าจะกรอก (ไม่ทำให้ verify แดง
  เพราะเป็นเรื่องข้อมูลของ deployment ไม่ใช่ความถูกต้องของโค้ด)
- **`customer_address` ไม่เคยถูก snapshot** — §86/4(3) บังคับให้มีที่อยู่ผู้ซื้อบนใบกำกับภาษี แต่ทั้ง
  `receipts` และ `quotations` เก็บแค่ชื่อ+เลขผู้เสียภาษี (docblock ของ `ICustomerLookupResult` อ้าง
  §86/4(2) ไว้เองแต่ตกข้อ (3)) · เพิ่มคอลัมน์ `customer_address` ทั้งสองตาราง (nullable, ไม่ backfill —
  เอกสารเก่าไม่มีค่านี้จริง ๆ), เติม `address` เข้า lookup contract, snapshot ตอน create และ
  re-snapshot ตอน update เหมือน `customer_name_*` · migration รันบน DB จริงแล้วทั้ง `erp_sales`
  และ `erp_finance`

**ยืนยันด้วยการรันจริง**: `pnpm verify finance-bc` / `sales-bc` / `report-bc` เขียวครบทั้งสามตัว ·
smoke ยิงพิมพ์จริงผ่าน RMQ → Gotenberg → storage แล้วอ่าน `document_prints` กลับมาเช็คว่าเป็น
`banded` v3 จริง, snapshot มี `items[]` จริง, ลายน้ำตรงกับสถานะเอกสาร และดาวน์โหลด PDF จาก presigned
URL มาเช็คว่าเป็น `%PDF-` ขนาด ~70KB · นอกจากนี้ยัง render เทมเพลตด้วย Chrome headless ในเครื่อง
(ประกอบ `__RP_DATA__` แบบเดียวกับ `BandedRenderService`) แล้ว**ดูหน้ากระดาษจริง**: 34 บรรทัด → 3 หน้า,
หัวเอกสาร/หัวคอลัมน์ซ้ำทุกหน้า, filler เต็มกล่อง, สรุปยอดอยู่หน้าสุดท้าย, ลายน้ำ DRAFT เอียงกลางหน้า

### 7.4 P4 — 12/25 · 2026-09-09 ✅ **ทุกใบที่มี endpoint แล้ว พิมพ์ได้จริงหมด**

**ไม่ได้เขียน HTML 12 ไฟล์** — ความต่างที่เป็น *ข้อความ* (ชื่อเอกสารที่ §86/4(1) บังคับให้เอกสาร
เรียกตัวเอง, โน้ต §86/6 ว่าราคารวม VAT แล้ว) ส่งมาเป็น params ที่ mapper ประกอบให้ ตามแพตเทิร์นเดียว
กับ `wht_line`/`draft_watermark_text` ที่ P3 วางไว้ · เขียนไฟล์แยกเฉพาะความต่างที่เป็น **โครงสร้าง**:

| ไฟล์ | อัปโหลดเข้า `print_templates.code` | ทำไมต้องแยกไฟล์ |
|---|---|---|
| `receipt-tax-invoice.html` | `receipt_full_tax_invoice`, `receipt_inv_tax_invoice`, `receipt_abb_tax_invoice` | มีบรรทัด VAT ที่ §86/4(6) สั่งให้แยกให้ชัด |
| `receipt-non-tax.html` | `receipt_plain`, `receipt_invoice`, `receipt_proforma_invoice` | ไม่มีบรรทัด VAT เลย (สามประเภทนี้บังคับ VAT = 0 อยู่แล้ว) + ต้องประกาศว่าไม่ใช่ใบกำกับภาษี |
| `receipt-adjustment.html` | `receipt_credit_note`, `receipt_debit_note` | §86/10 — ต้องอ้างเอกสารเดิม + แสดง **มูลค่าเดิม / มูลค่าที่ถูกต้อง / ผลต่าง** + สาเหตุ |
| `quotation.html` | `quotation_standard`, `quotation_revised`, `quotation_cost_estimate`, `quotation_tender` | layout เดียว ต่างกันแค่ชื่อเอกสาร |

**ใบลดหนี้/เพิ่มหนี้ต้องแก้ mapper จริง ไม่ใช่แค่ HTML** — §86/10 อยากได้ตัวเลขสามตัว ไม่ใช่ตัวเดียว:
ระบบเก็บแค่ *ผลต่าง* (ยอดของเอกสารใบนี้เอง) · มูลค่าเดิมมาจากเอกสารที่อ้างถึง (ต้องโหลด relation
`reference_receipt` ตอน print — เพิ่มเข้า `RECEIPT_ALLOWED_RELATIONS` แล้ว) และมูลค่าที่ถูกต้องคือ
เลขคณิตระหว่างสองตัวนั้น (ใบลดหนี้ลบ ใบเพิ่มหนี้บวก) · **สาเหตุ** ยังไม่มีคอลัมน์ของตัวเอง — ใช้
`remark_th` ไปก่อน ซึ่งคือช่องที่ผู้ใช้พิมพ์ "สาเหตุการออกใบลดหนี้" ลงไปจริงวันนี้ · ถ้าจะทำให้ถูกต้อง
เต็มรูปควรมีคอลัมน์แยก (ยังไม่ทำ — เป็นการตัดสินใจเรื่อง schema ที่ควรถามก่อน)

**ยืนยัน** — verify เขียวทั้ง finance-bc / sales-bc / report-bc · smoke พิมพ์ใบลดหนี้จริงบนคลัสเตอร์
แล้วอ่าน snapshot กลับมาเช็ค: `document_title_th = 'ใบลดหนี้'`, `original_total` ไม่ว่าง (พิสูจน์ว่า
relation ถูกโหลดจริง — ถ้าลืมขอ relation ค่านี้จะว่างเงียบ ๆ) และเลขเดินถูก
(`original 360.80 → corrected 270.60`)

**รอบสอง — ใบสั่งซื้อ (supplier-bc), 4 code · endpoint ใหม่ตัวแรกหลัง P2**

`POST /purchase-orders/:id/print` (`purchase_order:print`) — โครงเดียวกับ P2 ทุกชิ้น (proxy no-throw →
503, mapper เป็น pure function แยกไฟล์, การพิมพ์ไม่แตะแถวเอกสาร, `needs` ใน smoke ครบสามตัว) ·
`purchase-order.html` เป็น layout ไม่มี VAT: **PO ไม่มีคอลัมน์ VAT เลยทั้งตาราง** เพราะภาษีไปจบที่
ใบกำกับของผู้ขาย (`ap_invoices`) ไม่ใช่ที่ใบสั่งซื้อ · ช่องผู้ขายแทนผู้ซื้อ + กำหนดส่งมอบ +
ข้อความให้ผู้ขายอ้างเลขที่ PO บนใบส่งของ/ใบกำกับ

**ช่องว่างที่เจอตอนทำ (แก้แล้ว)** — `purchase_order_items` **ไม่เคย snapshot ชื่อ/SKU สินค้าเลย** มีแค่
`product_id` · ใบสั่งซื้อที่พิมพ์ออกมาจึงไม่มีรายการสินค้าให้ผู้ขายอ่าน · แก้โดยเพิ่ม `product_sku`,
`product_name_th/en` (nullable) แล้วให้ `resolveValidProductLine()` (เดิมชื่อ `assertValidProductLine()`
ซึ่ง**ทิ้งผลลัพธ์ RPC ไปเปล่า ๆ**) คืนค่ามาเก็บ — RPC เดิมตัวเดียวกันที่ validate อยู่แล้ว ไม่เพิ่ม
round trip · เอกสารเก่าพิมพ์ช่องรายการว่าง (nullable ไม่ backfill) และ smoke log จำนวนบรรทัดที่มี
snapshot ให้เห็นทุกครั้ง — ตอนนี้ PO ที่มีอยู่ในคลัสเตอร์คือ `1 line(s), 0 with a product snapshot`

**เหลืออีก 9 ใบ** (`sales_order`, `delivery_note`, `sales_return`, `billing_note`, `payment_entry`,
`purchase_return`, `goods_receipt`, `ap_invoice_vendor_bill`,
`ap_invoice_credit_note`) — **ทั้งหมดยังไม่มี `POST /:id/print` เลยสักตัว** งานต่อใบจึงไม่ใช่แค่ HTML
แต่คือ endpoint + proxy + mapper + smoke ของ BC เจ้าของ (sales-bc, supplier-bc, inventory-bc,
finance-bc) เหมือนที่ P2 ทำให้ 2 ใบแรก · แถว `invoice` → `PAYMENT_RECEIPT` ยังเป็นขยะจากระบบอื่นตาม
§8.2 ข้อ 4 (ยังไม่ลบ)

---

## 8 · สถานะการตัดสินใจ

### 8.1 ✅ ตัดสินใจแล้ว (2026-09-06) — เริ่ม P0 ได้เลย

| # | เรื่อง | ข้อสรุป |
|---|---|---|
| 1 | ที่เก็บ `company_profiles` | **finance-bc** (ตัวตนทางภาษี, ใช้ซ้ำกับ ภ.พ.30/WHT) — report-bc ดึง+cache+merge เข้า `params` เอง |
| 2 | ขอบเขต multi-company | **บริษัทเดียว + หลายสาขา** — ไม่ทำ multi-tenant |
| 3 | พิมพ์เอกสาร `DRAFT` | **พิมพ์ได้ + บังคับลายน้ำ DRAFT (server เป็นคนเติม)**, `copy_number = 0` ไม่นับเป็นต้นฉบับ |
| 4 | เอกสาร 2 ใบแรกของ P2 | **ใบกำกับภาษีเต็มรูป** (finance-bc) + **ใบเสนอราคา** (sales-bc) |
| 5 | ใครประกอบ `params` | **BC เจ้าของเอกสาร** ไม่ใช่ report-bc (§2.2) |
| 6 | snapshot ตอนพิมพ์ | **เก็บ** `params` + `print_template_version` + ไฟล์ PDF (§3) |

### 8.2 ⏳ ยังเปิดอยู่ — ไม่บล็อก P0–P1 แต่ต้องตอบก่อนถึงเฟสที่เกี่ยว

| # | เรื่อง | ต้องตอบก่อนเฟส | หมายเหตุ |
|---|---|---|---|
| 1 | **§6.2 ต้นฉบับ / สำเนา / ใบแทน** — เงื่อนไขและข้อความที่ต้องพิมพ์จริง (§86/12 + ประกาศอธิบดีฯ) | **P5** | ต้องให้**ฝ่ายบัญชี**ยืนยัน อย่าเดา · schema (`copy_number`/`print_reason`) รองรับไว้แล้วตั้งแต่ P1 |
| 2 | **เก็บ PDF นานแค่ไหน** — 5 ปีตามกฎหมายภาษี หรือถาวร | **P1** (ตอนตั้ง bucket) | ต้องกัน MinIO lifecycle ไม่ให้ลบไฟล์กลุ่มนี้ · ค่า default ที่จะใช้ถ้าไม่ตอบ = **เก็บถาวร** (ปลอดภัยกว่า ลบทีหลังได้เสมอ) |
| 3 | **ภาษาบนเอกสาร** — ใบเดียว 2 ภาษา หรือแยกใบตาม `locale` | **P3** | schema ที่เสนอรองรับแบบ**แยกใบ**อยู่แล้ว (`locale` บน `document_prints`) |
| 4 | **แถวขยะใน `print_templates`/`document_types`** — `acktest_1..5`, `test`, `__dry_run_test__`, `PAYMENT_RECEIPT` (ผูก mock data ระบบ POS อื่น), `test_invoice`, `invoice` | **P1** | ลบได้แล้ววันนี้ (`DELETE` ใช้งานได้หลังแก้บั๊ก 2026-09-06) · ค่า default ถ้าไม่ตอบ = **ไม่แตะ** ปล่อยไว้ก่อน |
| 5 | เอกสารรู้ได้ยังไงว่าออกจากสาขาไหน | **P4** | P0–P3 default เป็นสำนักงานใหญ่ (`00000`) ไปก่อน — ดู §6.1 ท้ายหัวข้อ |
