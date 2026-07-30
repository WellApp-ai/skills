# Document attachment — DOC-

Gate 6. Attachment integrity, the RLS tenancy finding, and the two-direction bound formula for the true error rate.

---

#### Document attachment (`DOC-`) — and a tenancy landmine

`documents` has 20 columns, all MCP-readable (Hasura `columns: '*'`), and user-updatable columns
are **only `filename` and `document_type`** — so `size` and `content_checksum` **cannot be faked
by a user**. `processing_status` enum: `pending | extracting | categorized | extracted | skipped |
failed | rejected`.

**Retrievability, answered precisely: "content recorded" ≠ "content retrievable."** `size` (NOT
NULL) and `content_checksum` make a 0-byte phantom mechanically detectable. But `bucket` and `path`
are **unvalidated strings** — nothing in the data layer asserts the GCS object still exists, and
`composite_file_preview_url` is a client-side deep link, not proof of bytes. **A green `size > 0`
must be reported as "file recorded", never "file retrievable."** Byte-level existence needs a
storage-side HEAD sweep outside the MCP.

**🔴 SECURITY, not hygiene: the `invoices` RLS filter is an `_or`.** A row is visible when
`workspace.workspace_id` matches **OR `document.workspace.workspace_id` matches**. So an invoice
owned by workspace B whose document belongs to workspace A **is readable from A**. A
cross-workspace attachment does not merely mislabel evidence — **it widens the read surface**. This
makes the cross-workspace-attachment check a security control that must run in *every* workspace,
not only the one under audit.

| id | name | bucket | check | sev |
|---|---|---|---|---|
| `DOC-02` | **False green** — `document_pk` resolves to nothing. **The one canonical dangling-attachment control point** | complete | `{"_and":[{"document_pk":{"_is_null":false}},{"_not":{"document":{}}}]}` — the relation inherits the `deleted_at IS NULL` + workspace filter, so a soft-deleted or out-of-scope document returns `document: null` while the FK stays populated. `BOOK-document-resolves` and `GRAPH-invoice-document-pk-dangling` checked this same population and were folded in here; the `GRAPH-` copy's amber is superseded by the red below | red |
| `DOC-03` | No recorded content | complete | `size < 1024` red; `1024–5120` amber; `content_checksum IS NULL` while `processing_status = extracted` red (the hasher only writes after reading bytes) | red |
| `DOC-04` | MIME cannot be evidence — **the one canonical document-kind control point** | complete | `type _nin` the typed allow-list, derived from the **existing** `ACCEPTED_DOCUMENT_FORMATS` const — do not invent a second list. `application/octet-stream` is its own finding (the magic-byte middleware should have rewritten it). **Never `_like` on `filename`** — filename is user-updatable, `type` is not. `BOOK-document-right-kind` checked this same allow-list over this same population and is folded in here; its amber is superseded by the red below, which the `B` term requires | red |
| `DOC-05` | Attached but invoice not extracted from it | complete | `document.processing_status _in [pending, extracting, failed, rejected, skipped]` — split the report: `failed`/`rejected` = unreadable file, the invoice data came from elsewhere (a decorative attachment) | red |
| `DOC-06` | Document type contradicts invoice type | complete | `invoices.document_type_code` ≠ `invoices.document.document_type`, both non-null | amber |
| `DOC-07` | **Cross-workspace attachment** — **the one canonical tenancy control point** | exhaustive | `{"_not":{"document":{"workspace":{"workspace_id":{"_eq":"<ws>"}}}}}` with `document_pk` non-null. Stated the other way round, which is the same predicate: **the document's workspace ≠ the invoice's workspace**. `BOOK-document-tenancy` said exactly that and is folded in here — this is a security control, not a bookkeeping one, so it lives with the RLS finding above and runs in every workspace | **red — security** |
| `DOC-08` | **Orphan document** — a file Well holds, linked to nothing. **The one canonical orphan-document control point** | exhaustive | `_not: {invoices:{}}` AND `_not: {transaction_documents:{}}`. **Two arms, reported separately.** (a) **receipt-capable MIME AND `size > 1024`** → red; this arm alone is the `C` term of the bound below. (b) any other orphan document (non-receipt MIME, or `size ≤ 1024`) → amber, storage debt, **never enters the attachment error rate**. Partition arm (a) by `processing_status`: **`extracted` is the worst** — the pipeline read it and still linked nothing (linker defect) | red (arm a); amber (arm b) |
| `DOC-10` | One document, many invoices | complete | fan-out read off row shape. **Legitimate**: one issuer, one period, distinct numbers (a consolidated statement). **Suspicious**: 2+ distinct issuers (a document cannot evidence two suppliers), or two children sharing issuer+date+total (a duplicate invoice the dedup missed) | red when suspicious |

**Two ids referenced but not defined here.** The tolerance paragraph below suppresses `DOC-01` and
the bound formula does not use `DOC-09`; neither id has a row in the table above. Until each is
written, treat any rule naming `DOC-01` as applying to `BOOK-invoice-has-document` (the "no document
attached" check it evidently means, and the canonical null-`document_pk` row now that
`RECON-invoice-missing-document` is folded into it), and treat `DOC-09` as vacant — **do not invent a
definition to close the numbering.**

**What the missing-receipt gap is checked by, once each.** Null `document_pk` →
`BOOK-invoice-has-document`. Populated but dangling → `DOC-02`. The orphan direction → `DOC-08`, whose
red arm (a) is the `C` term.

**The orphan overlap is adjudicated: `DOC-08` is canonical for orphan *documents*, in both arms.** It
previously shared its predicate with `GRAPH-orphan-documents-and-media`, which stated a broader
version (documents *and* `media`, no MIME or size filter, amber). The split is by root, not by
severity: every orphan `documents` row is `DOC-08` — arm (a) receipt-capable, arm (b) everything else,
so narrowing the `C` term costs no coverage — and the `media` half stays in the graph family as
`GRAPH-orphan-media`, where it belongs. `media_type` is `avatar|logo|banner`, so an orphan medium is
stale branding debt and **must never enter the attachment error rate**. With that split the `A`/`B`/`C`
terms each resolve to exactly one control point and one arm, so no term double-counts a row.

**The two-direction bound — the formula, and the reporting rule.** Over one period and workspace:

```
A  = invoices with document_pk IS NULL                    (what we report today)
B  = DOC-02 + DOC-03 + DOC-04, deduped by invoice         (the FALSE GREENS)
C  = orphan receipt-capable documents  ·  C* = subset with processing_status = extracted

true_missing_evidence = A + B                    ← not A
recoverable_in_house  = min(A + B, C*)           ← fix the linker
genuinely_absent      = (A + B) − recoverable    ← chase the supplier
```

`A` alone **undercounts by B and mis-attributes blame**: a gap whose file is already in the bucket
is a Well linking defect, yet `A` reports it to the customer as "your supplier never sent a
receipt". `C` alone overstates it (a workspace can hold 500 orphan PDFs and have zero real gaps).
**Reporting rule: never publish `A` without `B` and `C` alongside.** And `C* > 0` while `A > 0` in
the same workspace is *positive proof of a linker defect* — which neither number establishes alone.

**Tolerances:** 3 business days grace after `issue_date` before an unattached invoice counts
(suppress `DOC-01/05/08` inside it; **never** suppress `DOC-02/03/04/07` — those are structural and
time-independent). **Card/expense receipts: 5 calendar days and HIGH from the first occurrence above
the FR simplified-invoice VAT threshold (€25)** — stricter because on card spend the receipt is the
*only* evidence and without it the VAT is not deductible. Supplier invoices settled by transfer: 10
days, amber (the document normally arrives *before* payment, and the transfer leaves an independent
trail). Period share: amber above **2%**, red above **10%**, computed on **`(A+B)/N`, never `A/N`` —
an auditor pulling a 25-item sample hits a defect with ~40% probability at 2% and ~93% at 10%.

**Do NOT count orphan `media` in the attachment error rate** — `media_type` is `avatar|logo|banner`,
so an orphan medium is stale branding debt, not a lost receipt. Including it inflates the
bookkeeping defect count.

**Unreachable, and it is the strongest check that exists:** `document_extractions` and
`document_structured_extractions` carry `invoice_mapped_json`, `evidence_checksum`,
`source_checksum`, `page_count`, `prompt_version`, `quality_flags` — **provenance proving the
invoice fields were derived from *these* bytes.** Neither table is Hasura-tracked nor a read root,
so provenance is invisible to the sweep. Tracking them is the single highest-leverage addition.
