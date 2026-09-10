# PDF Form Manager — shared agent guidance

- Read `README.md`, actual root/client/server entry points, relevant current requirements/status, and scoped instructions. Preserve the lightweight browser → Express → PDF processing → generated document boundary; this is not the separate PDFizzle repository.
- Work on one valuable upload/field/template/fill journey with measurable acceptance and explicit non-goals. Do not add unrelated SaaS infrastructure or duplicate an existing product by default.
- Uploaded PDFs are untrusted and may be sensitive. Keep development private; validate type/size/content and malformed input, constrain filesystem paths, limit processing/storage, and require approved access/encryption/retention/deletion controls before customer data or public exposure.
- No private document contents or privileged credentials in Git, client logs, analytics, or public storage. Use synthetic/right-cleared PDFs, and require actual server-side authorization rather than UI-only restrictions.
- Retain any adopted canonical control standard and current owner authority; link detailed requirements instead of creating another constitution or competing roadmap.

## Real command and acceptance contract

- Root scripts: `npm start`, `npm run dev`, `npm run client`, `npm run dev:full`, `npm run install:all`. Inspect the client manifest for its own commands; do not assume a root test/build suite exists.
- `install:all` currently runs mutable npm installs in root/client; the inspected root has no lockfile. Reconcile actual workspaces and compatible runtime/package-manager pins, commit legitimate lockfiles through a real clean install, and use frozen installs thereafter. Do not claim the present setup is reproducible or fabricate pins.
- Root has no test/smoke script. Before a large feature establish a real synthetic flow: upload a known form, inspect/edit fields, save/reopen the template, fill values, and verify the returned PDF's expected fields/text/layout. Test rejected malformed/oversized input, unsafe paths, denied access, and cleanup behavior.
- Prove actual UI/API processing, not only helper functions or file presence. Ordinary tests use isolated storage and no Production/customer credentials or paid-provider calls; keep authorized hosted checks separate.
- Never add placeholder-success scripts, suppress errors, or silently skip prerequisites. Demonstrate intentional failure detection when establishing/changing verification.
- Document variable names, consuming process, environments, public/server-only classification, and validation methods—not values.

## Economical CI and handoff

- Run focused local checks before coherent pushes; broaden for upload/parser/filesystem/security, auth/contracts, dependencies/toolchains/workflows, and agent policy. Read full failing logs before reruns; avoid speculative pushes and duplicate expensive jobs.
- Ordinary prose-only routing needs an explicit allowlist; policy/executable Markdown is impact-bearing. Preserve observable required workflows and a tested final gate rejecting failed/cancelled/missing required work.
- Use least privilege, immutable action references, and untrusted/privileged separation. Cancel superseded PR checks only where safe, not deployments/migrations. Verify actual branch rules, canonical targets, environment scopes, triggers, recovery, and release authority before merging; merges may deploy.
- Reuse approved projects/previews. Fix relevant blockers/invariants and record unrelated cleanup without expanding scope. Preserve existing checklist/progress, keep it concise/evidence-linked, and use PROJECT_CHECKLIST/PROGRESS when adopted without parallel trackers.
- Track implemented/wired/locally verified/hosted verified/released independently with SHA, command/results, target, and evidence. Report actual checks, blockers, genuine owner decisions, and next smallest task; load deeper docs/skills selectively and confirm fresh Codex/Claude loading.

Adoption evidence: 2026-09-10, inspected README/root/manifest/main at `e14b0c8b9ac4c3b04b7135b6adac14b6904a838d`. Runtime/PDF/browser/fresh-agent/failure checks NOT_RUN; local cloning unavailable due to DNS resolution. No code, dependency, workflow, document, secret, platform, or release change.
