# Handoff — งานที่ต้องทำต่อ (หลังรอบ 2026-10-26)

> เขียนเมื่อ 2026-10-26 ~22:30 (เวลาไทย) · ต่อจาก `HANDOFF-product-suspend-sales-review.md` (ผลรีวิว 3 branch ของ poompakorn)
> และ `HANDOFF-Feature.md` §2 รายการ 2026-10-26

---

## 0. สถานะล่าสุด (อัปเดต 2026-10-27 ~10:30)

| | commit ที่ขึ้นระบบจริง | หมายเหตุ |
|---|---|---|
| **erp-api** (`main`) | `6c44f47` (iam) · `bd48925` (BC อื่น — deploy เฉพาะ BC ที่เปลี่ยน) | §1.1 + §1.2 deploy แล้ว |
| **erp-frontend** (`main`) | `e1a5cfb` (merge `feature/sales` — หน้าบิลพักของ poompakorn) | §2.1 + §2.2 + §3.1 push แล้วที่ branch `fix/sales-discount-both` (`e300025`…`6b3422b`, 2026-10-27) — **ยังไม่ merge เข้า `main`** (= ยังไม่ขึ้นระบบ) · ดู §2 |
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

## 2. frontend — ตัดสินแล้ว / รอตัดสิน

### 2.1 ✅ ส่วนลดรายสินค้า + ส่วนลดท้ายบิลพร้อมกัน — ตัดสินแล้ว 2026-10-27: **รองรับทั้งสองแบบในบิลเดียว** (`discount_mode: both`) · backend deploy แล้ว (`ecb143d`) · **frontend push แล้วที่ branch `fix/sales-discount-both` — รอทดสอบในเบราว์เซอร์ + merge**

- **frontend ที่ทำแล้ว (2026-10-27):**
  - `discountMode` ไม่เป็น state แยกแล้ว — คำนวณจากข้อมูลจริงทุกครั้ง (มีส่วนลดรายการไหม × มีท้ายบิลไหม → `none`/`per_item`/`header`/`both`)
    ผ่าน `packages/shared/utils/discount` (มี unit test 8 เคส รวม 100 − 10 − 10% = 81) · state เดิมคือต้นเหตุที่หน้าจอกับ payload ไม่ตรงกัน
  - ทุก payload (ใบเสนอราคา, SO จาก POS, ขาย POS, พักบิล, แก้บิลพัก) ใช้ `discountFields` ชุดเดียว · SO จาก POS ส่ง `discount_type` รายบรรทัดด้วย
  - `taxSummary` คิด % ท้ายบิลจากยอดหลังหักส่วนลดรายการ · ส่วนลดรายการแบบ `percent` (บิลพักที่โหลดกลับมา) แปลงเป็นเงินก่อนคำนวณ
  - ส่วนลดท้ายบิลเกินยอดหลังหักรายการ / % เกิน 100 → ขึ้นข้อความเตือนก่อนส่ง (`actions.headerDiscountExceedsNet`) แทนการรอ 400
  - หน้าสรุปยอดโชว์ป้ายทั้งสองอันเมื่อเป็น `both`
  - **บั๊กที่เจอเพิ่ม:** ปิดบิลพักที่โหลดกลับมาแล้วแก้ไข → `complete` ส่งแค่การชำระเงิน server จึงคิดเงินตามรายการเดิมตอนพัก ·
    แก้: `PUT` บิลพักด้วยรายการบนหน้าจอก่อน แล้วค่อย `complete`
  - commit: `e300025` (both) · `6d06c23` (บิลพักที่แก้ไข) · `7c4ae32` (`remark_en: null`) · `6b3422b` (ลบ `nameEnRequired`)
  - `check-types` / `lint` / `test` ทั้ง workspace (19 task) + `build` ของ web ผ่าน · **ยังไม่ได้ทดสอบในเบราว์เซอร์กับ API จริง** —
    ก่อน merge ให้ลองบนหน้าจอ: ใบเสนอราคา (DRAFT, ลบได้) สินค้า 100 ลดรายการ 10 + ท้ายบิล 10% → หน้าจอและเอกสารที่บันทึกต้องเป็น 81 ทั้งคู่ ·
    พักบิล → โหลดกลับ → แก้จำนวน → ชำระ → ยอดในใบกำกับต้องตรงกับที่แก้
  - ใบสั่งซื้อ (`core-purchase`) ยังเป็นโหมดเลือกแบบเดียว (ผู้ใช้เลือก `header` หรือ `per_item`) — ถูกต้องอยู่แล้ว ไม่มีบั๊กเงินหาย · ถ้าจะให้ใช้ร่วมกันค่อยทำเพิ่ม

- ปัญหาเดิม (ยืนยันในโค้ด `origin/main`): หน้าจอรวมทั้งสองแบบ แต่ส่ง `header` → server ทิ้งส่วนลดรายสินค้า → **ลูกค้าจ่ายมากกว่าหน้าจอ**
  — เป็นทั้งหน้า POS **และใบเสนอราคา** (`packages/core-sales/hooks/use-sales/use-sales.ts` ~บรรทัด 1093 และ 1336)
- backend: โหมดใหม่ `both` = ลดรายบรรทัดก่อน แล้วลดท้ายบิลจาก**ยอดหลังหักส่วนลดรายการ** (`sub_total − Σ ส่วนลดรายการ`) — ทุกเอกสาร
  (ใบเสนอราคา/SO, POS, ใบเสร็จ/ใบกำกับ, ใบแจ้งหนี้ผู้ขาย, PO, ใบรับสินค้าที่พิมพ์) · ดู `HANDOFF-Feature.md` §2 รายการ 2026-10-27
- **ที่ frontend ต้องแก้ (โจทย์เดิม — ทำครบทั้ง 4 ข้อแล้วตามด้านบน):**
  1. มีส่วนลดทั้งสองแบบ → ส่ง `discount_mode: 'both'` + `discount_type`/`discount_value` ของท้ายบิล + ส่วนลดรายบรรทัดตามเดิม
     (มีแบบเดียว → `header` / `per_item` เหมือนเดิม) — ใน `effectiveDiscountMode` ของทั้งสองจุด
  2. `taxSummary` ใน `use-sales.ts`: % ท้ายบิลต้องคิดจาก**ยอดหลังหักส่วนลดรายการ** ไม่ใช่ `subTotal` — ไม่งั้นหน้าจอไม่ตรงกับ server
     (เช่น 100 ลดรายการ 10 → 90 · ท้ายบิล 10% = 9 → **81** ไม่ใช่ 80)
  3. ส่วนลดท้ายบิลแบบจำนวนเงินต้องไม่เกินยอดหลังหักส่วนลดรายการ (เกิน → server ตอบ 400)
  4. สร้างใบสั่งขายจาก POS (~บรรทัด 1152 ส่ง `discount_mode: none` ตายตัว) → ใช้ `effectiveDiscountMode` ตัวเดียวกัน (เดิมอยู่ §3.1)
- ตัวกันชั่วคราว (ห้ามใช้สองแบบพร้อมกัน) **ไม่ต้องทำแล้ว** ถ้า frontend แก้ข้อ 1–2 ในรอบเดียวกับที่ backend deploy

### 2.2–2.4 ปิดแล้ว (2026-10-27)

| # | เรื่อง | ผล |
|---|---|---|
| 2.2 | หมายเหตุส่งข้อความเดียวกันไปทั้ง `remark_th` และ `remark_en` | ✅ ทำตามคำแนะนำ — ฝั่งขายส่ง `remark_en: null` ทุกเอกสาร (ฝั่งจัดซื้อส่ง `null` อยู่แล้ว) · branch `fix/sales-discount-both` |
| 2.3 | ชื่ออังกฤษที่ว่างในตาราง — กลุ่มสินค้าโชว์ "-" ลูกค้า/ผู้ขายซ่อนบรรทัด | ✅ **ไม่ต้องแก้** — ดูโค้ดแล้วสองแบบต่างกันจริง: กลุ่มสินค้ามี**คอลัมน์ชื่ออังกฤษแยก** เซลล์ว่างจึงควรเป็น "-" · ลูกค้า/ผู้ขายแสดงชื่ออังกฤษเป็น**บรรทัดรอง**ใต้ชื่อไทย จึงซ่อนได้ |
| 2.4 | หน้าจอบิลพัก (HELD) | ✅ poompakorn ทำแล้ว (`d8f63b5`, merge `e1a5cfb`) · บั๊กปิดบิลพักที่แก้ไขแล้วคิดเงินตามรายการเดิม แก้ใน §2.1 |

---

## 3. งานที่ทำได้เลย

### 3.1 frontend
- ~~🔴 สร้างใบสั่งขายจากหน้า POS ส่วนลดหาย~~ → ย้ายไปรวมใน §2.1 ข้อ 4
- 🟡 ชนิดข้อมูลเอกสาร (PO, GR, ใบเสนอราคา ฯลฯ) ประกาศ key แบนแบบ `supplier_name_th`/`_en` แต่ API ตอบเป็น `{ th, en }` ซ้อน —
  ปรับให้ตรงของจริง (refactor แยก ไม่เร่ง)
- ✅ translation key `nameEnRequired` ลบแล้วทั้ง 8 จุด (ลูกค้า, ผู้ขาย, สินค้า, กลุ่มสินค้า × th/en) + ตัว map ที่ตายแล้วใน `use-create-product/helpers.ts` · branch `fix/sales-discount-both`
- ✅ UX ชื่ออังกฤษที่ว่าง → §2.3 (ไม่ต้องแก้)
- ✅ หน้าจอบิลพัก (HELD) → §2.4 (ทำแล้ว)

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
