# EBPLS Storage Buckets

The app stores sensitive applicant uploads in private S3-compatible storage.

Required private buckets:

- `ebpls-pdfs`
- `ebpls-images`

Supported MIME types:

- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/webp`

Recommended active environment variables:

```env
S3_PDF_BUCKET=ebpls-pdfs
S3_IMAGE_BUCKET=ebpls-images
```

Do not use a generic document bucket such as `business-permit-documents` or `permits-documents` for applicant uploads.

Keep both buckets private. Do not enable public write access. Applicant documents should only be read through authorized application routes. Document rows in PostgreSQL must store metadata only:

- original filename
- MIME type
- file size
- storage key / path
- verification metadata

Do not store file blobs in PostgreSQL.

For MinIO, create both buckets in the MinIO console or with your deployment provisioning script. For Supabase S3-compatible storage, create private buckets with the names above in the Storage dashboard, then use the S3-compatible endpoint/keys already configured for the app.

Local development mock mode is allowed only when it is intentional:

```env
STORAGE_DRIVER=local
```

When local mock mode is enabled, the app stores files under `web/uploads/` and still keeps only document metadata in PostgreSQL.
