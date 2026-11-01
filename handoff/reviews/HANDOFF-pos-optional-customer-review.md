# Handoff — รีวิว PR #5 `feature/sales-optional-custumer` (ขายหน้าร้านแบบไม่ระบุลูกค้า)

> รีวิวเมื่อ 2026-11-01 · ผู้เขียน PR: poompakorn
> **รายละเอียดทั้งหมดอยู่ใน erp-api (private)** — PR #5 review + inline comment, checklist ใน issue **#7**,
> follow-up **#6** · ไฟล์นี้อยู่ใน repo สาธารณะ จึงเก็บไว้เฉพาะบทเรียนและกฎ ไม่มีรายละเอียดแบบช่องโหว่
> (ลำดับ request ที่ทำให้พัง, `file:line`) — ฉบับยาวรุ่นแรกยังอยู่ใน git history แต่ให้ใช้ issue เป็นหลัก

## PR นี้ทำอะไร

ให้ `customer_id` เป็น null ได้ทั้งสาย (sales-bc POS, finance-bc receipt / payment entry / COGS, report-bc profit-by-lot)
เพื่อขายหน้าร้านแบบ walk-in ด้วยใบกำกับภาษีอย่างย่อ (§86/6) และพักบิลโดยไม่ต้องเลือกลูกค้า — **กลับ design เดิม**
ที่บังคับใช้ customer "ลูกค้าทั่วไป" ต่อสาขา

## สถานะ

**Request changes** — รอผู้เขียนแก้ตาม issue #7 (ใน erp-api) · ห้าม merge จนกว่าทุกข้อใน #7 ถูกติ๊ก รวม D1 (เอกสาร)

## บทเรียนที่ควรเก็บไว้ (ใช้กับ PR ถัดไปได้เลย)

1. **ทำ field ให้ nullable = ต้องไล่ทุกจุดที่อ่าน field นั้น ไม่ใช่แค่จุดที่เขียน** — PR แก้ writer ที่ตั้งใจไว้ครบ แต่ bug อยู่ที่ reader:
   รายงานที่ `continue` ข้ามแถวที่เป็น null (ยอดรวมไม่ตรง GL), การเทียบ `a === b` ที่ `null === null` ผ่าน, ข้อความ GL ที่ต่อ string ได้ `"null"`
   — `.claude/rules/entities-and-schema.md` § Changing a source column changes every copy of it
2. **ไม่บังคับ field ได้ "เฉพาะ document type ไหน"** — ข้อกำหนดตามกฎหมายต่างกันต่อ type (อย่างย่อ §86/6 ไม่ต้องระบุผู้ซื้อ,
   เต็มรูป §86/4 ต้องระบุ, ใบขายเชื่อต้องมีลูกหนี้) การ "nullable ทุก type" กว้างเกินเสมอ — `business-documents.md` § Statutory documents
3. **update ต้องตรวจกฎกับแถว "ที่จะเป็น" และ `issue()` คือด่านสุดท้าย** — กฎที่ตรวจเฉพาะเมื่อ field อยู่ใน body ถูกข้ามได้ด้วยการแก้ field อื่น
4. **`undefined` ≠ `null` บน update** — `data.x ?? stored.x` ถือว่า "ล้างค่า" เท่ากับ "ไม่ได้ส่ง" (`api-contract.md` § Optional body fields)
5. **เงินที่ไม่มีเจ้าของต้องถูกปฏิเสธ** — ยอดรับล่วงหน้าที่ไม่มีคู่ค้าเอาไปตัด/คืนไม่ได้ และหายจากรายงาน — `business-documents.md` § Refuse what does not add up
6. **migration ต้องเป็นไฟล์ที่ TypeORM generate ตรง ๆ** — ไฟล์ที่ "ผลเหมือนกัน" แต่ไม่ตรง (ตัดคู่ FK drop/re-add ออก) หรือ timestamp แต่งเอง
   คือเขียนเอง → ลบแล้ว generate ใหม่ — `migrations-and-seed.md` · ตรวจด้วย `.claude/skills/review-pr/scripts/migration-audit.mjs --generate`
7. **smoke ที่อ่านแค่ `information_schema` ไม่ได้ verify อะไร** — ต้องยิง endpoint จริง (root `CLAUDE.md` § Definition of Done)
8. **เปลี่ยน design ต้องแก้ spec ด้วย** — srs-p4 / srs-p5 / api-workflow-guide ยังเขียนตาม design เดิม (D1 ใน #7)

## เอกสารอ้างอิง (spec ที่ deploy แล้ว)

| เรื่อง | ลิงก์ |
|---|---|
| POS — spec ปัจจุบันยังบอกว่า "ต้องมี customer จริงเสมอ" (ต้องแก้ตาม D1) | [srs-p4 · Phase 4](https://iots1.github.io/plan-erp/srs-p4.html#p4) · [api-workflow-guide · B5](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-sell) |
| ใบกำกับอย่างย่อ §86/6 vs เต็มรูป §86/4 | [api-workflow-guide · A5](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-buy) |
| `document_type` ของ receipt · ออกเลข / CN-DN | [srs-p5 · Phase 5](https://iots1.github.io/plan-erp/srs-p5.html#p5) · [lifecycle](https://iots1.github.io/plan-erp/srs-p5.html#p5-lifecycle) |
| รับชำระ · aging C7 · เครดิตลูกค้า | [api-workflow-guide · ฝั่งเงิน](https://iots1.github.io/plan-erp/api-workflow-guide.html#flow-money) · [srs-p5 · customer credit](https://iots1.github.io/plan-erp/srs-p5.html#customer-credit) |
| กฎเอกสารธุรกิจ · migration | [backend-convention · 16](https://iots1.github.io/plan-erp/backend-convention.html#documents) · [13](https://iots1.github.io/plan-erp/backend-convention.html#migrations) |
| response `{ th, en }` เป็น stable contract | [i18n-guide · Response](https://iots1.github.io/plan-erp/i18n-guide.html#response) |
