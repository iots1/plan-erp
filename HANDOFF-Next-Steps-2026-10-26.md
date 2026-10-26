# Handoff — งานที่ต้องทำต่อ (หลังรอบ 2026-10-26)

> เขียนเมื่อ 2026-10-26 ~22:30 (เวลาไทย) · ต่อจาก `HANDOFF-product-suspend-sales-review.md` (ผลรีวิว 3 branch ของ poompakorn)
> และ `HANDOFF-Feature.md` §2 รายการ 2026-10-26

---

## 0. สถานะล่าสุด (อัปเดต 2026-10-27 ~01:00)

| | commit ที่ขึ้นระบบจริง | หมายเหตุ |
|---|---|---|
| **erp-api** (`main`) | `6c44f47` (iam) · `bd48925` (BC อื่น — deploy เฉพาะ BC ที่เปลี่ยน) | §1.1 + §1.2 deploy แล้ว |
| **erp-frontend** (`main`) | `cdc91c0` — `erp-web` online, หน้าแรก 200 | ไม่มีอะไรต้องแก้เพิ่มจาก §1.1 (ดู §1.1 "frontend") · checkout หลักในเครื่องค้างที่ `08cf389` (ตามหลัง `origin/main` 3 commit) |
| **docs/plan-erp** | `b457243` | SRS / api-workflow / i18n-guide ครบถึง "ทุกช่อง `_en` ไม่บังคับ" · pin ใน erp-api ชี้ตัวนี้แล้ว |
| **server** | Node `24.22.1` ทั้ง PM2 daemon และ systemd unit | `24.18.0` ยังติดตั้งไว้เผื่อย้อนกลับ |

ทดสอบบนโดเมนจริงผ่านทุกชุดที่รันรอบ 2026-10-26 (บิลพัก, ส่วนลด POS, ขาย POS, ใบเสนอราคา, สินค้า/ลูกค้า/ผู้ขายไม่มีชื่ออังกฤษ, พิมพ์สลิป)
และรอบ §1.1 (smoke `*en*optional*` 7 ไฟล์ 7/7 บนโดเมน)

---

## 1. งานที่ค้างกลางทาง

### 1.1 ทุกช่อง `_en` ของระบบเป็น optional (backend) — ✅ **merge + deploy แล้ว** (`4bbd489`, `76cc610`, merge `9a41bbb`, pin `bd48925`)

- ทำครบตามขอบเขต: ช่อง `*_en` ที่ยัง `NOT NULL` 17 ช่อง + snapshot → nullable · body DTO `@IsOptional()` + `T | null` ·
  interface ข้าม BC / contracts / response DTO / print mapper รับ null · migration generate 6 BC รันแล้ว ·
  `schema:log` ครบ 7 database ไม่มี diff · กฎใน `entities-and-schema.md` + check `en-column-not-null` · smoke 6 BC
- แก้เพิ่มจากที่ worktree ทำไว้: profile บริษัทที่สร้างอัตโนมัติครั้งแรก และ permission ที่สร้างมือ เก็บ `NULL` แทน `''`/`undefined`
- verify ครบ 6 ขั้นทั้ง iam / inventory / supplier / sales / finance / report · `check:branch` 0 error
- **ทดสอบบนโดเมน:** smoke 7 ไฟล์ (`apps/*/test/smoke/*en*optional*.smoke.mjs`) ยิงผ่าน wrapper ที่ชี้ไปโดเมนจริง + ตรวจ Postgres → **7/7 PASS**
  (ข้อมูลทดสอบถูกลบเอง · smoke finance PATCH company profile แล้วคืนค่าเดิมใน `finally`)
- **frontend:** ไม่มีอะไรต้องแก้เพิ่ม — `origin/main` ไม่มีฟอร์มไหนบังคับชื่ออังกฤษแล้ว และฟอร์มที่มี (ลูกค้า, ผู้ขาย, สินค้า, กลุ่มสินค้า, ตั้งค่าร้าน) ส่ง `name_en: x.trim() || null` อยู่แล้ว ·
  master อื่น (คลัง, หน่วยนับ, price list, ประเภทภาษี, ผังบัญชี, role/policy ฯลฯ) ยังไม่มีหน้าใน frontend — อยู่ในหน้า admin EJS ของ iam (§1.2)
- worktree `../erp-api-wt/optional-en` + branch `chore/optional-en-columns` ลบได้แล้ว (merge แล้ว)

### 1.2 หน้า admin EJS ของ iam ยังบังคับชื่ออังกฤษ — ✅ **แก้ + deploy แล้ว** (`6c44f47`)

- เจอตอนตรวจหลัง deploy: 10 ฟอร์ม (คลัง, หน่วยนับ, ประเภทภาษี, tax config, ผังบัญชี, permission, policy, role, เทมเพลตพิมพ์, ประเภทเอกสาร)
  ยังตั้ง `required: true` ที่ช่อง English และส่ง `name_en: '...'.trim()` → ปล่อยว่างแล้ว **กดบันทึกไม่ได้** และถ้าข้าม required ไปได้จะเก็บ `''` ไม่ใช่ `NULL`
- แก้: ถอด `required: true` ทั้ง 10 ช่อง (`apps/iam/views/pages/*/form.ejs`, `permissions/index.ejs`) + payload `.trim() || null` (`apps/iam/public/pages/user-management/js/*.service.js`)
  · ตารางแสดงผลไม่ต้องแก้ — `escapeHtml(null)` คืน `''` อยู่แล้ว
- smoke: `apps/iam/test/smoke/admin-pages.smoke.mjs` เพิ่มเช็ค 10 ช่อง English ต้องไม่มี `required` (ลองถอดตัวแก้ออกแล้ว smoke FAIL ตามคาด)
- verify iam ครบ 6 ขั้น · **บนโดเมน:** `admin-pages` + `en-names-optional` ของ iam ผ่าน 2/2 (10 ช่องไม่มี `required`) และ bundle ที่ deploy ส่ง `.trim()||null` จริง
- ตัดสินใจแล้ว: **ไม่กลับไปบังคับ** — ถ้าบังคับเฉพาะหน้า admin ขณะที่ API รับค่าว่าง ข้อมูลก็ยังว่างได้จากทางอื่น และคนจะกรอกชื่อปลอมให้ผ่าน ·
  ถ้าลูกค้ารายไหนต้องการชื่ออังกฤษจริง (เช่น ใบกำกับส่งออก) ให้เป็นกฎใน API เฉพาะเอกสารนั้น หรือเตือนตอนพิมพ์
- ⚠️ **ห้ามรัน `migration:generate` จาก checkout ที่ยังไม่ pull `bd48925`** — DB ใช้ร่วมกันและเป็น nullable แล้ว entity เก่าจะ generate `SET NOT NULL` กลับ

---

## 2. รอการตัดสินใจ (frontend)

| # | เรื่อง | ที่ | ทางเลือก |
|---|---|---|---|
| 2.1 | 🔴 **ส่วนลดท้ายบิล + ส่วนลดรายสินค้าพร้อมกันที่หน้า POS** — หน้าจอรวมทั้งสองแบบ แต่ส่ง `header` ไป server จึงทิ้งส่วนลดรายสินค้า **ลูกค้าจ่ายไม่ตรงกับหน้าจอ** | erp-frontend `packages/core-sales/hooks/use-sales.ts` (ส่วนสร้างบิล POS) | (ก) ห้ามใช้สองแบบพร้อมกันบนหน้าจอ — ตรงกฎ "เลือกได้แบบเดียว" ของ `business-documents.md` · (ข) เกลี่ยส่วนลดท้ายบิลลงรายสินค้าแล้วส่ง `per_item` |
| 2.2 | 🟠 **หมายเหตุ** — ส่งข้อความช่องเดียวกันไปทั้ง `remark_th` และ `remark_en` (ใบเสนอราคา, ใบสั่งขาย, ใบส่งของ, POS) — แบบเดียวกับ "ใส่ไทยในช่องอังกฤษ" ที่เพิ่งเลิกไป | `use-sales.ts` | ส่ง `remark_en: null` (แนะนำ) หรือคงไว้ |

---

## 3. งานที่ทำได้เลย

### 3.1 frontend
- 🔴 **สร้างใบสั่งขายจากหน้า POS ส่วนลดหาย** — `use-sales.ts` ~บรรทัด 1150 สร้างใบเสนอราคาด้วย `discount_mode: none`
  และไม่ส่ง field ส่วนลดหัวบิล ส่วนลดที่กรอกหายหมด → ส่ง `discount_mode` + `discount_type`/`discount_value` ให้ตรงกับที่กรอก
- 🟡 ชนิดข้อมูลเอกสาร (PO, GR, ใบเสนอราคา ฯลฯ) ประกาศ key แบนแบบ `supplier_name_th`/`_en` แต่ API ตอบเป็น `{ th, en }` ซ้อน —
  ปรับให้ตรงของจริง (refactor แยก ไม่เร่ง)
- 🟡 translation key `drawer.validation.nameEnRequired` (ลูกค้า/ผู้ขาย) ไม่ได้ใช้แล้ว ลบได้
- 🟡 UX: ตารางกลุ่มสินค้าโชว์ "-" ในช่องชื่ออังกฤษที่ว่าง ส่วนตารางลูกค้า/ผู้ขายซ่อนบรรทัดอังกฤษ — ให้เหมือนกันไหม
- หน้าจอบิลพัก (HELD) ยังไม่มี — service + type พร้อมแล้ว (`packages/shared/services/sales/*-held-pos-sale.ts`)

### 3.2 backend — ข้อ 6–10 (1.1 merge แล้ว — เริ่มได้)

| # | เรื่อง | ที่ | แนวแก้ |
|---|---|---|---|
| 6 | ขาย POS ปกติเก็บ `discount_type`/`discount_value` แม้โหมดไม่ใช่ `header` — ขัดกฎ `business-documents.md` | `PosSalesService.create()` ตอนเรียก `recordSale` และ `createEntity` | ใช้แบบเดียวกับ `hold()`: นอก `header` บังคับเป็น `null` + unit test |
| 7 | finance-bc **ปฏิเสธ** (4xx) หลังตัดสต็อกแล้วใน `create()` → error หลุดออกไปโดยไม่ log `POS_SALE_FINANCE_FAILED` และสต็อกค้างตัด | `PosSalesService.create()` | `sendWithContext` **throw** เมื่อปลายทางตอบ 4xx/5xx (คืน `null` เฉพาะ transport ล่ม) — ห่อ `try/catch` แบบ `completeHeld()` + แก้ docblock ของ `PosSaleProxyService` / `StockProxyService` ที่บอกว่าคืน `null` |
| 8 | บิลค้าง `COMPLETING` (process ตายหลังออกใบกำกับ) ไม่มีทางกู้ผ่าน API | `PosSalesService` | endpoint สำหรับผู้มีสิทธิ์: ระบุ `receipt_id` ที่ออกไปแล้ว → ดึงตัวเลขจาก finance-bc → ปิดเป็น `COMPLETED` (ไม่ออกใบกำกับซ้ำ) · permission ใหม่ต้องตาม `permissions.md` (grant migration ก่อน deploy) |
| 9 | Swagger ของ `GET /quotations/:id` โชว์ `customer_id` ที่ไม่ได้ใช้ | `QuotationQueryParamsDTO` ใช้ทั้ง list และ detail | แยก DTO สำหรับ list |
| 10 | สลิป 80mm: `{{__page}}` ว่าง | `paginator.inline.js` เส้น "ไม่มี band" | เติม `1` แบบเดียวกับ `__pages` |

ทุกข้อ: unit + smoke + `pnpm verify` ครบ + อัปเดต SRS/api-workflow ในรอบเดียวกัน

---

## 4. ต้องมีคนดู (ไม่ใช่โค้ด)

1. **service ของโปรเจกต์อื่นที่อยู่บน server เดียวกัน restart วน** — box ไม่มี route ไปเครือข่ายภายในที่ DB/Redis ของมันอยู่
   เป็นมาก่อนแล้ว (process เดิม online ค้างไว้ตั้งแต่ ก.ย.) การสลับ Node แค่ทำให้เห็น — ไม่เกี่ยวกับ erp
2. **CI กับ runner ตัวเดียว** — CI รันทุก push ของ feature branch แล้ว (เพื่อจับปัญหาที่ review เจอซ้ำ) ทำให้ deploy อาจต่อคิวหลัง CI
   ตัดสินใจ: เพิ่ม runner สำหรับ deploy · หรือกลับไปรัน CI เฉพาะ PR แล้วพึ่ง `pnpm check:branch` ในเครื่อง
3. **มี Claude session อื่น push เข้า `main` ของ erp-api พร้อมกัน** (`b384efe` ถูก push 22:09 โดยไม่ได้สั่ง, `af37f1c`, `8798fc5`)
   ทุกตัวไม่เป็นอันตราย แต่ถ้าไม่ได้ตั้งใจเปิดหลาย session ให้ปิด — ก่อน commit/push ทุกครั้ง `git fetch` ดูก่อน
4. ใบ POS `POS-2026-00091` (`COMPLETED`, ลูกค้า `CUST-TEST-02`, 09:12 UTC) ไม่ได้มาจากชุดทดสอบ — เจ้าของ void เอง

---

## 5. เก็บกวาด

worktree ที่ merge แล้ว ลบได้ (`git worktree remove <path>` แล้ว `git branch -d <branch>`):

| repo | path | branch | สถานะ |
|---|---|---|---|
| erp-api | `../erp-api-wt/product` · `suspend-sales` · `optional-cus-supplier` | `feature/*` 3 ตัว | ✅ ลบ worktree + branch ในเครื่องแล้ว (2026-10-26 ตอนดิสก์เต็ม) |
| erp-api | `../erp-api-wt/optional-en` | `chore/optional-en-columns` | merge แล้ว — ลบได้ |
| erp-frontend | `../erp-frontend-wt/api-contract` | `fix/api-contract-2026-10-26` | merge แล้ว |

branch บน remote (`feature/product`, `feature/suspend-sales`, `feature/optional-cus-supplier`, `fix/api-contract-2026-10-26`)
ลบได้หลังแจ้ง poompakorn ให้ `git pull` แล้ว — commit แก้ไขต่อท้ายของเขาอยู่บน `main` ครบ

checkout หลักของ erp-frontend มี `M docs/plan-erp` ค้างอยู่ก่อนรอบนี้ (ไม่ใช่ของรอบนี้) — เจ้าของเครื่องตัดสินใจเอง

---

## 6. บทเรียนรอบนี้ (กันพลาดซ้ำ)

- **สลับ Node ของ PM2 อย่าใช้ `pm2 update`** — ค้างแล้วทุก app ล่ม ~7 นาที ให้ `pm2 save` → สำรอง `~/.pm2/dump.pm2`
  → `pm2 kill` → `pm2 resurrect` (ด้วย Node ใหม่บน PATH) → `pm2 startup systemd -u root --hp /root` → `pm2 save`
  และถือ lock `/tmp/ovh-dev-pm2-deploy.lock` ระหว่างทำ กัน deploy แทรก
- **`sendWithContext` throw เมื่อ BC ปลายทางตอบ 4xx/5xx** — คืน `null` เฉพาะตอน transport ล่ม (docblock ของ proxy ใน sales-bc ยังเขียนผิด)
- **inventory-bc `ConfirmDelivery` ข้าม `source_doc_id` ที่เคยบันทึก แม้ถูก reverse ไปแล้ว** — บรรทัดที่คืนสต็อกต้องได้ id ใหม่ก่อนตัดซ้ำ
- **อ่าน DB หลังเขียนใน smoke ใช้ `eventually`** (อยู่ใน smoke context แล้ว) — pgpool กระจาย SELECT ไป standby ที่อาจยัง replay ไม่ทัน
- **smoke ของหลาย worktree ห้ามรันพร้อมกัน** — ใช้ port และ Postgres ชุดเดียวกัน
- **รายงานของ agent ต้องตรวจกับ `git diff` เสมอ** — รอบนี้มี agent บอกว่าแก้ Swagger แล้วแต่ไฟล์ไม่เปลี่ยน
- **"English ไม่บังคับ" ต้องไล่ถึง UI ใน repo นี้ด้วย** — หน้า admin EJS ของ iam (`apps/iam/views` + `public/.../*.service.js`) มี `required: true` และส่ง `''` แยกจาก DTO
  smoke / unit มองไม่เห็น เพราะยิง API ตรง (§1.2)
- **ดิสก์เต็มทำให้ verify ล้มที่ขั้น build** (`ENOSPC`) และ Claude Code รันคำสั่งไม่ได้เลย — worktree หนึ่งตัว ~580 MB · `Docker.raw` คือดิสก์ของ VM (image + volume) ไม่ใช่ cache ห้ามลบเพื่อเอาที่
- เครื่องมือใหม่: `pnpm check:branch`, check ใหม่ใน convention-guard, skill `review-branch`, rule `branches-and-commits.md`
