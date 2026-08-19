import { NextRequest, NextResponse } from "next/server";
import { testGoogleAuthText, getGoogleApiKeyDiagnostics } from "@/lib/google-client";

export async function GET(request: NextRequest) {
  try {
    const diag = getGoogleApiKeyDiagnostics();
    const testResult = await testGoogleAuthText();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      diagnostics: {
        geminiKeyStatus: diag.geminiKeyStatus,
        googleKeyStatus: diag.googleKeyStatus,
        selectedKeySource: diag.selectedKeySource,
        fingerprint: diag.fingerprint,
      },
      authTest: {
        success: testResult.success,
        httpStatus: testResult.httpStatus,
        statusLabel: testResult.success ? "CONNECTED" : "FAILED",
        errorMessage: testResult.errorMessage || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        error: err.message || "Failed to execute Google authentication test",
      },
      { status: 500 }
    );
  }
}
