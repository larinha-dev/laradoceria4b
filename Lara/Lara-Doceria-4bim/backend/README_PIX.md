PIX integration notes

This server supports multiple ways to generate a PIX QR code. The default provider is Banco do Brasil (BB), but a local fallback is available when BB is not configured.

1) Banco do Brasil (recommended) — OAuth2 flow and create 'cob' via Banco do Brasil APIs; if successful, the server returns QR payload or QR URL that the BB app can use (includes the value).
2) Local payload + QR code using `qrcode-pix` (no external bank API needed; fallback when BB is not configured).
3) Optional: SISPRIME or other PSP — if you prefer a different PSP, configure env vars similarly and the server will attempt to create a charge via that provider.

Configuration

- Add the following environment variables to your backend environment (.env or process environment):
  - SISPRIME_API_URL (e.g., https://api.sisprime.example)
  - SISPRIME_API_KEY (Bearer token or API key provided by Sisprime)

  Banco do Brasil (BB) integration (production)
  -------------------------------------------
  To integrate with Banco do Brasil and generate a QR that will be recognized by the Bank's app, you'll need to register a Pix application with Banco do Brasil and obtain a client id and client secret (and possibly certificate) from their developer portal.

  Environment variables to configure:
   - BB_API_URL (example: https://api.hm.bb.example)
   - BB_CLIENT_ID
   - BB_CLIENT_SECRET
   - If BB requires mutual TLS or certificate auth, you'll need to add additional config (e.g., BB_CLIENT_CERT / BB_CLIENT_KEY) and modify the integration accordingly.

  Notes:
  - The BB API uses OAuth2 to obtain an access token. The endpoint and payload can vary depending on the bank environment. The code uses basic client credentials and expects token at /oauth/token and charge creation at /pix/v1/cob. You must adapt endpoints to BB's exact API contract.
  - The endpoint may require `txid` or return `location` header where the QR data is stored; the code tries to request location if returned.
  - For security and proper operation, you must use a sandbox or production credentials provided by Banco do Brasil.

  Testing with Banco do Brasil
  ---------------------------
  - Set the environment variables then restart the server.
  - Create a POST request to `/pix/gerar` with `banco: 'bb'`, and the `valor`, `chave`, `nome`, `cidade`.
  - The backend will return JSON with `provider: 'bb'`, and the `payload` and/or `qrCode` to render in the frontend.

  If you want me to adapt the code to BB's exact endpoints, paste the API documentation or a sample request/response, and I will update the implementation accordingly.

Usage

- To generate a PIX from the frontend, POST to `/pix/gerar` with a body like:

  {
    "valor": 12.5,
    "chave": "+5511999999999",
    "nome": "Nome Recebedor",
    "cidade": "Peabiru",
    "banco": "bb" // default provider: Banco do Brasil, or omit to use default
  }

- The endpoint returns `payload` (copia e cola) and `qrCode` (dataurl or URL). It also returns a `provider` field indicating `sisprime` or `local`.

Notes and Security

- Do not commit SISPRIME_API_KEY to version control. Use environment variables or secrets management.
- The example code assumes a SISPRIME API endpoint; please adapt payload/endpoint to your bank's official docs.
- For production, we recommend using HTTPS and verifying ISO/PSP responses.

Testing without SISPRIME

- With no SISPRIME env set, the server will generate a local payload/QR using `qrcode-pix`.
- This is sufficient for demo and client-side (Copia e Cola) payments.
