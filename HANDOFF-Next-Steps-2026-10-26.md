# Handoff — งานที่ต้องทำต่อ (หลังรอบ 2026-10-26)

> เขียนเมื่อ 2026-10-26 ~22:30 (เวลาไทย) · ต่อจาก `HANDOFF-product-suspend-sales-review.md` (ผลรีวิว 3 branch ของ poompakorn)
> และ `HANDOFF-Feature.md` §2 รายการ 2026-10-26

---

## 0. สถานะตอนเขียน

| | commit ที่ขึ้นระบบจริง | หมายเหตุ |
|---|---|---|
| **erp-api** (`main`) | `8798fc5` — ทุก service `/health` ตรง (ตรวจล่าสุดที่ `af37f1c` ซึ่งต่างกันแค่ pin เอกสาร) | รวม 3 branch ของ poompakorn แล้วทั้งหมด |
| **erp-frontend** (`main`) | `cdc91c0` — `erp-web` online, หน้าแรก 200 | ชนิดข้อมูล + ฟอร์มรองรับชื่ออังกฤษเป็น null แล้ว |
| **docs/plan-erp** | `e305b24` | SRS / api-workflow / i18n-guide อัปเดตครบถึงลูกค้า-ผู้ขาย |
| **server** | Node `24.22.1` ทั้ง PM2 daemon และ systemd unit | `24.18.0` ยังติดตั้งไว้เผื่อย้อนกลับ |

ทดสอบบนโดเมนจริงผ่านทุกชุดที่รันรอบนี้ (บิลพัก, ส่วนลด POS, ขาย POS, ใบเสนอราคา, สินค้า/ลูกค้า/ผู้ขายไม่มีชื่ออังกฤษ, พิมพ์สลิป)

---

## 1. งานที่ค้างกลางทาง — ทำต่อก่อนอย่างอื่น

### 1.1 ทุกช่อง `_en` ของระบบเป็น optional (backend) — **ยังไม่ commit**

- worktree: `../erp-api-wt/optional-en` · branch `chore/optional-en-columns` (แตกจาก `main` @ `21aa675`)
- ตอนเขียน: แก้ไปแล้ว ~92 ไฟล์ ยังไม่ commit — **ต้องตรวจว่างานเสร็จหรือยัง** (`git -C ../erp-api-wt/optional-en status`)
- ขอบเขตที่สั่งไว้:
  1. ช่อง `*_en` ที่ยัง `NOT NULL` ~17 ช่อง → `nullable: true` + `string | null`
     (finance: company profile/branch ชื่อ+ที่อยู่, GL account, tax config · iam: permission, policy, role ·
     inventory: item group, price list, tax category, uom, warehouse · report: document type, print template,
     `warehouse_name_en` ใน low_stocks/expiry_alerts · sales/supplier: customer/supplier group)
  2. snapshot ของช่องเหล่านั้นทุกที่ → nullable
  3. body DTO ทุกตัวที่มี `*_en` → `@IsOptional()` + `T | null` (ไม่มี `?`)
  4. interface ข้าม BC / response DTO / print mapper รองรับ null
  5. migration **generate** ทุก BC ที่กระทบ + รัน + `migration:generate` ต้องไม่เจอ diff ครบ 7 database
  6. กฎใหม่ใน `entities-and-schema.md` + check `en-column-not-null` ใน convention-guard
  7. smoke ต่อ BC ที่แก้: สร้าง master data ไม่ใส่ชื่ออังกฤษ → เก็บ NULL, ตอบ `{ th, en: null }`
- ขั้นต่อไป: ตรวจ diff เอง (เคยมี agent รายงานว่าแก้แล้วแต่ไม่ได้เขียนจริง) → `pnpm verify` ทุก BC ที่แตะ (ครบ 6 ขั้น)
  → `node scripts/check-branch.mjs` 0 error → commit แยกเรื่อง → push branch → merge เข้า `main`
  → อัปเดต SRS (`srs-p1..p6` ตาราง master data) + `api-workflow-guide` + `i18n-guide` §02 → push submodule ก่อน แล้ว pin
  → push `main` (= deploy) → ทดสอบบนโดเมน → แจ้ง frontend ว่าฟอร์ม master data ไม่ต้องบังคับชื่ออังกฤษ (ฝั่ง frontend ทำรอไว้แล้ว)
- **ความคืบหน้า (2026-10-26 ดึก):** ตรวจ diff แล้วงานเขียนจริงครบ · แก้เพิ่ม 2 จุด (profile บริษัทที่สร้างอัตโนมัติ + permission ที่สร้างมือ เก็บ `NULL` แทน `''`/`undefined`) ·
  migration 6 BC รันแล้ว · `schema:log` 7 database ไม่มี diff · verify iam/inventory/supplier/sales ผ่านครบ 6 ขั้น (finance/report กำลังรัน) ·
  เอกสาร SRS p1–p6 / api-workflow / i18n-guide §02 / HANDOFF-Feature §2 อัปเดตและ push แล้ว (ก่อนโค้ด merge) — ที่เหลือ: verify finance/report → check:branch → commit → merge → deploy → ทดสอบบนโดเมน
- ⚠️ **ห้ามรัน `migration:generate` จากที่อื่นพร้อมกัน** — DB ใช้ร่วมกัน ถ้า migration ของ branch นี้รันไปแล้วแต่ entity บน `main` ยังเป็น
  `NOT NULL` การ generate จาก `main` จะสร้าง migration ใส่ `NOT NULL` กลับ

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

### 3.2 backend — ข้อ 6–10 (ทำหลัง 1.1 merge แล้ว)

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
| erp-api | `../erp-api-wt/product` | `feature/product` | merge แล้ว |
| erp-api | `../erp-api-wt/suspend-sales` | `feature/suspend-sales` | merge แล้ว |
| erp-api | `../erp-api-wt/optional-cus-supplier` | `feature/optional-cus-supplier` | merge แล้ว |
| erp-api | `../erp-api-wt/optional-en` | `chore/optional-en-columns` | **ยังไม่เสร็จ — อย่าลบ** (§1.1) |
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
- เครื่องมือใหม่: `pnpm check:branch`, check ใหม่ใน convention-guard, skill `review-branch`, rule `branches-and-commits.md`
