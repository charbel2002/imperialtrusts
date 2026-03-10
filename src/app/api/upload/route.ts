import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put, del, list } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Dual-mode KYC file upload:
 *   • Production  (BLOB_READ_WRITE_TOKEN is set) → Vercel Blob Storage
 *   • Development (no token)                     → local filesystem
 *
 * On Vercel the filesystem is read-only, so we MUST use Blob storage.
 * If running on Vercel without a token we return an explicit error
 * instead of silently trying (and failing) to write to disk.
 */
const isVercel = !!process.env.VERCEL;
const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN?.trim();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "id_document" or "selfie"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["id_document", "selfie"].includes(type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    // Validate file type
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and PDF files are accepted" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${type}_${Date.now()}.${ext}`;

    if (isVercel && !hasBlobToken) {
      return NextResponse.json(
        { error: "File storage is not configured. Please contact support." },
        { status: 500 }
      );
    }

    if (hasBlobToken) {
      // ---- Vercel Blob Storage ----

      // Delete previous blob for this type (avoid orphaned files)
      const prefix = `kyc/${session.user.id}/${type}_`;
      try {
        const existing = await list({ prefix });
        if (existing.blobs.length > 0) {
          await del(existing.blobs.map((b) => b.url));
        }
      } catch {
        // Non-critical – old blob stays, just upload the new one
      }

      const blob = await put(`kyc/${session.user.id}/${filename}`, file, {
        access: "public",
        addRandomSuffix: false,
      });

      return NextResponse.json({ path: blob.url });
    } else {
      // ---- Local filesystem (development) ----

      const uploadDir = path.join(process.cwd(), "public", "uploads", "kyc", session.user.id);
      await mkdir(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      const publicPath = `/uploads/kyc/${session.user.id}/${filename}`;
      return NextResponse.json({ path: publicPath });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
