/**
 * Incremental copy of the private "media" bucket to a second, S3-compatible store
 * (Cloudflare R2, AWS S3, …). Supabase's database backups do NOT include storage objects.
 *
 * Run nightly (see .github/workflows/backup.yml):
 *   npx tsx scripts/backup-storage.ts
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY,
 *      BACKUP_S3_ENDPOINT, BACKUP_S3_REGION, BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY_ID, BACKUP_S3_SECRET_ACCESS_KEY
 *
 * Privacy: configure a lifecycle rule on the backup bucket that expires objects after 30 days,
 * so files a customer deletes are gone from backups within 30 days (see docs/SECURITY.md).
 */
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`missing ${k}`);
  return v;
};

export async function backup() {
  const sb = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SECRET_KEY"), { auth: { persistSession: false } });
  const s3 = new S3Client({
    endpoint: need("BACKUP_S3_ENDPOINT"),
    region: process.env.BACKUP_S3_REGION ?? "auto",
    forcePathStyle: true,
    credentials: { accessKeyId: need("BACKUP_S3_ACCESS_KEY_ID"), secretAccessKey: need("BACKUP_S3_SECRET_ACCESS_KEY") },
  });
  const Bucket = need("BACKUP_S3_BUCKET");
  const store = sb.storage.from("media");
  const report = { checked: 0, copied: 0, failed: 0 };

  // Layout is "<asset id>/<variant>": list top-level folders, then their files.
  for (let offset = 0; ; offset += 1000) {
    const { data: folders, error } = await store.list("", { limit: 1000, offset });
    if (error) throw error;
    if (!folders?.length) break;
    for (const folder of folders) {
      const { data: files } = await store.list(folder.name, { limit: 100 });
      for (const f of files ?? []) {
        const Key = `media/${folder.name}/${f.name}`;
        report.checked++;
        try {
          await s3.send(new HeadObjectCommand({ Bucket, Key }));
          continue; // already backed up (objects are immutable once processed)
        } catch {
          /* not there yet */
        }
        try {
          const { data: blob, error: dlErr } = await store.download(`${folder.name}/${f.name}`);
          if (dlErr || !blob) throw dlErr ?? new Error("download failed");
          await s3.send(new PutObjectCommand({ Bucket, Key, Body: Buffer.from(await blob.arrayBuffer()), ContentType: blob.type || "application/octet-stream" }));
          report.copied++;
        } catch {
          report.failed++;
        }
      }
    }
    if (folders.length < 1000) break;
  }
  return report;
}

if (process.argv[1]?.includes("backup-storage")) {
  backup().then(
    (r) => {
      console.log(JSON.stringify({ event: "storage.backup", ...r }));
      if (r.failed) process.exitCode = 1;
    },
    (e) => {
      console.error(JSON.stringify({ event: "storage.backup_failed", error: String(e) }));
      process.exitCode = 1;
    },
  );
}
