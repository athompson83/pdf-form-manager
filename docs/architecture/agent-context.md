# Architecture context for agents

Source baseline: e14b0c8b9ac4c3b04b7135b6adac14b6904a838d on main. The README describes a prototype for PDF form detection, management, and filling; it explicitly says authentication, authorization, secure storage, upload validation, malware protection, audit, privacy, and automated tests need implementation and verification.

## Repository has parallel runtime trees

- Root package scripts start root server.js. Root index.html loads app.js and styles.css to provide a separate standalone PDF.js/pdf-lib browser editor. The HTML also references a credential-bearing configuration script excluded from analysis. Do not inspect, copy, or repeat its value.
- Root server.js is a legacy Express API: POST /api/upload stores files on local disk and uses pdf-lib to return AcroForm fields; additional routes cover field reads, Bubble connection/field lookup, webhook creation/execution, static uploads, and health. Webhook templates are held in memory. README says controls required for production are missing.
- client/ is a Create React App package. client/src/index.js imports './App'; both App.js and App.tsx exist. The pinned import resolver maps index.js to App.tsx, but actual bundler resolution was not tested. App.js contains an older PDF upload stepper that calls the root API; App.tsx defines a route-based login/dashboard/template/API-key/user/log/Bubble surface. Treat this entry choice as an unresolved ambiguity.
- server/ is another independent package with a TypeScript/Express/Mongoose scaffold and a distinct dist entrypoint. server/src/index.ts mounts auth, templates, API-key, user, and log routes. PDF, Bubble, field-mapping, and webhook route modules exist but are not imported by that entrypoint. Root scripts do not launch this package.
- config.js is excluded from graph inventory and all fragments because its source contains a credential-like hardcoded value. Its referencing HTML summary omits the file path; provenance records only the filename and exclusion reason.

## Diagrams

- [System overview](./system-overview.mmd)
- [Legacy upload/API flow](./server-flow.mmd)

## Source map

- Legacy browser and root API: index.html, app.js, styles.css, server.js
- React client: client/src/index.js, client/src/App.tsx, client/src/App.js, client/src/components/
- TypeScript server scaffold: server/src/index.ts, server/src/routes/, server/src/controllers/, server/src/models/
- Tests and fixtures: client/src/__tests__/, server/src/__tests__/
- Analysis graph: .ua/knowledge-graph.json; inventory/import map: .ua/intermediate/scan-result.json
