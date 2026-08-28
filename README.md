# ERP Development Plan

เอกสารประกอบโครงการ ERP — สถาปัตยกรรมระบบ, ข้อกำหนดระบบ (SRS) และแนวทางพัฒนา

🔗 **Live site:** https://iots1.github.io/plan-erp/

## Documents

| Document | Description |
|---|---|
| [Index](https://iots1.github.io/plan-erp/index.html) | หน้ารวมลิงก์เอกสารทั้งหมด |
| [ERP Architecture](https://iots1.github.io/plan-erp/erp-architecture.html) | Microservices DDD Design · Development Plan |
| [Core Feature (SRS)](https://iots1.github.io/plan-erp/core-feature.html) | SRS Overview — Phase 1–6 + Site Map |
| [SRS · P1](https://iots1.github.io/plan-erp/srs-p1.html) | Identity &amp; Access — Login · RBAC · Policy (PBAC/ABAC) · JWT |
| [SRS · P2](https://iots1.github.io/plan-erp/srs-p2.html) | Master Data &amp; Storage — Item · Group · UOM · Warehouse · Supplier · MinIO |
| [SRS · P3](https://iots1.github.io/plan-erp/srs-p3.html) | Inventory Core — Lot · FIFO/FEFO · Bundle · Goods Movement |
| [SRS · P4](https://iots1.github.io/plan-erp/srs-p4.html) | Procurement &amp; Sales — PO · Quotation → SO → Delivery |
| [SRS · P5](https://iots1.github.io/plan-erp/srs-p5.html) | Finance — Receipt · Tax · WHT · COGS &amp; P&amp;L per Lot |
| [SRS · P6](https://iots1.github.io/plan-erp/srs-p6.html) | Reporting — CQRS Read Models (แผน) + Print Service (as-built) |
| [Backend Conventions](https://iots1.github.io/plan-erp/backend-convention.html) | Naming · JSON:API · Errors · Query Params · Controllers · Entities · Migrations |
| [i18n Guide](https://iots1.github.io/plan-erp/i18n-guide.html) | แนวทางการพัฒนาระบบ 2 ภาษา (TH/EN) |
| [Product Image Upload Guide](https://iots1.github.io/plan-erp/product-image-upload-guide.html) | Presigned Upload · Multipart Create · MinIO |
| [IAM Policy Engine](https://iots1.github.io/plan-erp/iam-policy-engine-guide.html) | Core Invariant · API Contract · Defect Log |
| [Next.js Integration Guide](https://iots1.github.io/plan-erp/nextjs-permission-guide.html) | Frontend Integration · Permission System |
| [Observability Guide](https://iots1.github.io/plan-erp/observability-logging-guide.html) | OpenTelemetry → Tempo · pino-http → Loki |
| [PostgreSQL + Pgpool-II](https://iots1.github.io/plan-erp/postgresql-pgpool-cluster-guide.html) | Connection Pooling &amp; HA Cluster · Grafana |
| [Deployment Guide](https://iots1.github.io/plan-erp/deployment-guide.html) | On-Premise · Docker Compose · Kong · Cloudflare Tunnel |
| [Incident Runbook](https://iots1.github.io/plan-erp/runbook.html) | Symptom → Diagnosis → Fix → Verify |

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
