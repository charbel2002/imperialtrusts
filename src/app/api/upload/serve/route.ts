import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAdminSession } from "@/lib/admin-session";
import { authOptions } from "@/lib/auth";
import { getDownloadUrl } from "@vercel/blob";

/**
 * Proxy route for serving private Vercel Blob files.
 *
 * Usage:  GET /api/upload/serve?url=<encodedBlobUrl>
 *
 * Only authenticated users (the file owner) or admins can access.
 * Generates a short-lived download URL and redirects to it.
 */
export async function GET(request: NextRequest) {
  // Must be logged in (either regular user or admin)
  const session = await getServerSession(authOptions);
  const admin = await getAdminSession();
  if (!session && !admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blobUrl = request.nextUrl.searchParams.get("url");
  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const downloadUrl = await getDownloadUrl(blobUrl);
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Blob serve error:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
