// Google Sheets API service — reads/writes vocabulary data
// Uses service account JWT auth directly from the browser
import { GOOGLE_SERVICE_ACCOUNT, SPREADSHEET_ID, SHEET_NAME } from "./config";
import type { VocabData } from "./gemini";

export interface SheetRow {
  serial: number;
  word: string;
  banglaMeaning: string;
  sentence: string;
  synonym: string;
  antonym: string;
}

// --- JWT / Auth helpers ---

/** Base64url encode a string or Uint8Array */
function base64url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Import PEM private key for RS256 signing */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(pemBody);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);

  return crypto.subtle.importKey(
    "pkcs8",
    buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/** Create a signed JWT for Google APIs */
async function createJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: GOOGLE_SERVICE_ACCOUNT.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(GOOGLE_SERVICE_ACCOUNT.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

/** Exchange JWT for an access token */
let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() / 1000 < cachedToken.expires - 60) {
    return cachedToken.token;
  }

  const jwt = await createJWT();
  const response = await fetch(GOOGLE_SERVICE_ACCOUNT.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expires: Math.floor(Date.now() / 1000) + data.expires_in,
  };
  return data.access_token;
}

// --- Sheets API helpers ---

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/** Fetch all rows from the vocabulary sheet */
export async function getAllWords(): Promise<SheetRow[]> {
  const token = await getAccessToken();
  const range = `${SHEET_NAME}!A2:F`; // Skip header row

  const response = await fetch(
    `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sheets read error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  return rows.map((row, index) => ({
    serial: parseInt(row[0]) || index + 1,
    word: row[1] || "",
    banglaMeaning: row[2] || "",
    sentence: row[3] || "",
    synonym: row[4] || "",
    antonym: row[5] || "",
  }));
}

/** Check if a word already exists in the sheet */
export async function checkDuplicate(word: string): Promise<boolean> {
  const words = await getAllWords();
  return words.some(
    (row) => row.word.toLowerCase() === word.toLowerCase()
  );
}

/** Append a new vocabulary entry to the sheet */
export async function appendWord(vocab: VocabData): Promise<void> {
  const token = await getAccessToken();

  // Get current row count for serial number
  const existing = await getAllWords();
  const serial = existing.length + 1;

  const range = `${SHEET_NAME}!A:F`;
  const values = [
    [serial, vocab.word, vocab.banglaMeaning, vocab.sentence, vocab.synonym, vocab.antonym],
  ];

  const response = await fetch(
    `${SHEETS_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sheets append error (${response.status}): ${errorText}`);
  }
}
