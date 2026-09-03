<div align="center">

# PDF Form Manager

**A lightweight web application for detecting, managing, and filling PDF form fields.**

![Stage](https://img.shields.io/badge/stage-prototype-EA580C?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Express-EA580C?style=flat-square&logo=node.js&logoColor=white)
![PDF](https://img.shields.io/badge/PDF-pdf--lib%20%2B%20PDF.js-EA580C?style=flat-square)

</div>

## Overview

PDF Form Manager provides a simple client/server foundation for uploading PDF forms, identifying form fields, managing reusable templates, previewing documents, and producing filled PDFs.

## Current capabilities

- PDF form-field detection and inspection
- Form-value entry and PDF generation
- Reusable form-template management
- Browser preview workflow
- Express API with upload handling
- React client application

## Architecture

```text
Browser client → Express API → PDF processing → generated document
```

The server uses Express, Multer, `pdf-lib`, CORS, and filesystem helpers. The client is maintained in the `client/` workspace.

## Local development

Install root and client dependencies:

```bash
npm run install:all
```

Run the API and client together:

```bash
npm run dev:full
```

Other commands:

```bash
npm start       # API server
npm run dev     # API server with nodemon
npm run client  # React client only
```

## Production gaps

> [!CAUTION]
> This repository should be treated as a prototype until document storage, authentication, authorization, upload validation, malware protection, rate limiting, audit logging, privacy controls, and automated tests are implemented and verified.

Uploaded PDFs may contain sensitive information. Do not expose the development server publicly or retain customer documents without an approved storage, access, encryption, and deletion policy.