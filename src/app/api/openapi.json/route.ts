import { NextResponse } from "next/server";
import { generateOpenApiSpec } from "@/lib/api/openapi-generator";

export async function GET() {
  const spec = generateOpenApiSpec();
  return NextResponse.json(spec);
}
