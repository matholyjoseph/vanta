import crypto from "crypto";

export interface GoogleKeyDiagnostics {
  geminiKeyStatus: "CONFIGURED" | "MISSING" | "INVALID_PROJECT_ID" | "PLACEHOLDER";
  googleKeyStatus: "CONFIGURED" | "MISSING" | "INVALID_PROJECT_ID" | "PLACEHOLDER";
  selectedKeySource: "GEMINI_API_KEY" | "GOOGLE_API_KEY" | "NONE";
  fingerprint: string;
}

export function getGoogleApiKeyDiagnostics(): GoogleKeyDiagnostics {
  const geminiRaw = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  const googleRaw = (process.env.GOOGLE_API_KEY || "").trim().replace(/^["']|["']$/g, "");

  const evaluateKey = (key: string): "CONFIGURED" | "MISSING" | "INVALID_PROJECT_ID" | "PLACEHOLDER" => {
    if (!key) return "MISSING";
    if (key.startsWith("gen-lang-client-")) return "INVALID_PROJECT_ID";
    if (key.includes("your_api_key") || key === "undefined" || key === "null") return "PLACEHOLDER";
    return "CONFIGURED";
  };

  const geminiStatus = evaluateKey(geminiRaw);
  const googleStatus = evaluateKey(googleRaw);

  let selectedSource: "GEMINI_API_KEY" | "GOOGLE_API_KEY" | "NONE" = "NONE";
  let activeKey = "";

  if (geminiStatus === "CONFIGURED") {
    selectedSource = "GEMINI_API_KEY";
    activeKey = geminiRaw;
  } else if (googleStatus === "CONFIGURED") {
    selectedSource = "GOOGLE_API_KEY";
    activeKey = googleRaw;
  }

  const fingerprint = activeKey
    ? crypto.createHash("sha256").update(activeKey).digest("hex").substring(0, 8)
    : "NO_KEY";

  return {
    geminiKeyStatus: geminiStatus,
    googleKeyStatus: googleStatus,
    selectedKeySource: selectedSource,
    fingerprint,
  };
}

export function getGoogleApiKey(): string {
  const geminiRaw = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  const googleRaw = (process.env.GOOGLE_API_KEY || "").trim().replace(/^["']|["']$/g, "");

  if (geminiRaw && !geminiRaw.startsWith("gen-lang-client-") && !geminiRaw.includes("your_api_key")) {
    return geminiRaw;
  }
  if (googleRaw && !googleRaw.startsWith("gen-lang-client-") && !googleRaw.includes("your_api_key")) {
    return googleRaw;
  }

  throw new Error("Google Gemini API key is not configured or invalid project identifier was provided.");
}

export async function testGoogleAuthText(): Promise<{
  success: boolean;
  httpStatus: number;
  fingerprint: string;
  errorMessage?: string;
}> {
  const diag = getGoogleApiKeyDiagnostics();
  if (diag.selectedKeySource === "NONE") {
    return {
      success: false,
      httpStatus: 401,
      fingerprint: diag.fingerprint,
      errorMessage: "No valid GEMINI_API_KEY configured in environment.",
    };
  }

  const apiKey = getGoogleApiKey();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with OK" }] }],
        }),
      }
    );

    if (response.ok) {
      return {
        success: true,
        httpStatus: response.status,
        fingerprint: diag.fingerprint,
      };
    }

    const errData = await response.json().catch(() => ({}));
    const msg = errData.error?.message || `HTTP ${response.status} Authentication Failure`;
    return {
      success: false,
      httpStatus: response.status,
      fingerprint: diag.fingerprint,
      errorMessage: msg,
    };
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 500,
      fingerprint: diag.fingerprint,
      errorMessage: err.message || "Network error connecting to Google Gemini API",
    };
  }
}
