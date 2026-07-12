# ERP Development Plan

เอกสารประกอบโครงการ ERP — สถาปัตยกรรมระบบ, ข้อกำหนดระบบ (SRS) และแนวทางพัฒนา

🔗 **Live site:** https://iots1.github.io/plan-erp/

## Documents

| Document | Description |
|---|---|
| [Index](https://iots1.github.io/plan-erp/index.html) | หน้ารวมลิงก์เอกสารทั้งหมด |
| [ERP Architecture](https://iots1.github.io/plan-erp/erp-architecture.html) | Microservices DDD Design · Development Plan |
| [Core Feature (SRS)](https://iots1.github.io/plan-erp/core-feature.html) | System Requirement Specification — Phase 3–6 |
| [i18n Guide](https://iots1.github.io/plan-erp/i18n-guide.html) | แนวทางการพัฒนาระบบ 2 ภาษา (TH/EN) |

## Local Development

```bash
npx live-server
```

หรือ

```bash
python3 -m http.server 8000
```

## Deployment

Push ไปที่ branch `main` จะ trigger GitHub Actions (`.github/workflows/deploy.yml`) เพื่อ deploy ไปยัง GitHub Pages โดยอัตโนมัติ

ตั้งค่าครั้งแรก: **Settings → Pages → Source → GitHub Actions**
