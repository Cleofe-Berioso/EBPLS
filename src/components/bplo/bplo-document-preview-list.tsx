"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { actionButtonStyles } from "@/components/ui/action-button";

type BploDocumentListItem = {
  id: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

type BploDocumentPreviewListProps = {
  applicationId: string;
  documents: BploDocumentListItem[];
};

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();
  return extension ? extension.toLowerCase() : "";
}

function resolvePreviewType(document: BploDocumentListItem | null) {
  if (!document) return "unsupported" as const;
  if (document.mimeType === "application/pdf" || getFileExtension(document.fileName) === "pdf") {
    return "pdf" as const;
  }
  if (document.mimeType.startsWith("image/") || IMAGE_EXTENSIONS.has(getFileExtension(document.fileName))) {
    return "image" as const;
  }
  return "unsupported" as const;
}

export function BploDocumentPreviewList({ applicationId, documents }: BploDocumentPreviewListProps) {
  const [selectedDocument, setSelectedDocument] = useState<BploDocumentListItem | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const previewType = useMemo(() => resolvePreviewType(selectedDocument), [selectedDocument]);
  const previewUrl = useMemo(() => {
    if (!applicationId || !selectedDocument?.id) {
      return null;
    }

    return `/api/bplo/applications/${applicationId}/documents/${selectedDocument.id}/preview`;
  }, [applicationId, selectedDocument]);
  const downloadUrl = useMemo(() => {
    if (!applicationId || !selectedDocument?.id) {
      return null;
    }

    return `/api/bplo/applications/${applicationId}/documents/${selectedDocument.id}/download`;
  }, [applicationId, selectedDocument]);

  useEffect(() => {
    if (!isDocumentModalOpen || !selectedDocument) {
      setIsPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    if (!previewUrl) {
      setIsPreviewLoading(false);
      setPreviewError("Document preview URL is unavailable.");
      return;
    }

    if (previewType === "unsupported") {
      setIsPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);
  }, [isDocumentModalOpen, previewType, previewUrl, selectedDocument]);

  function openDocument(document: BploDocumentListItem) {
    setSelectedDocument(document);
    setIsDocumentModalOpen(true);
  }

  function closeDocumentModal() {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
    setIsPreviewLoading(false);
    setPreviewError(null);
  }

  const footer = selectedDocument ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={actionButtonStyles("secondary", "sm")}
        >
          Open in New Tab
        </a>
      ) : (
        <button type="button" className={actionButtonStyles("readOnly", "sm")} disabled>
          Open in New Tab
        </button>
      )}
      {downloadUrl ? (
        <a href={downloadUrl} className={actionButtonStyles("secondary", "sm")}>
          Download
        </a>
      ) : null}
      <button type="button" onClick={closeDocumentModal} className={actionButtonStyles("primary", "sm")}>
        Close
      </button>
    </div>
  ) : undefined;

  return (
    <>
      <ul className="space-y-2 text-sm text-slate-700">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <div>
              <p>
                <strong>{document.documentName}</strong>: {document.fileName}
              </p>
              <p className="text-xs text-slate-500">Uploaded: {formatDateTime(document.uploadedAt)}</p>
            </div>
            <button
              type="button"
              onClick={() => openDocument(document)}
              className={actionButtonStyles("secondary", "sm")}
            >
              View
            </button>
          </li>
        ))}
        {documents.length === 0 ? (
          <li>
            <EmptyState title="No uploaded documents" description="No records available yet for this application." />
          </li>
        ) : null}
      </ul>

      <Modal
        open={isDocumentModalOpen}
        title={selectedDocument?.documentName ?? "Document Preview"}
        description="Preview uploaded requirements without leaving the application review page."
        onClose={closeDocumentModal}
        footer={footer}
        size="lg"
      >
        {selectedDocument ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Requirement</p>
                <p className="mt-1 font-medium text-slate-900">{selectedDocument.documentName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Uploaded Filename</p>
                <p className="mt-1 break-all font-medium text-slate-900">{selectedDocument.fileName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Uploaded</p>
                <p className="mt-1 font-medium text-slate-900">{formatDateTime(selectedDocument.uploadedAt)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {!previewUrl ? (
                <div className="flex min-h-[22rem] items-center justify-center px-6 py-10 text-center text-sm text-rose-700 sm:min-h-[28rem]">
                  Document preview URL is unavailable.
                </div>
              ) : previewType === "unsupported" ? (
                <div className="flex min-h-[22rem] items-center justify-center px-6 py-10 text-center text-sm text-slate-600 sm:min-h-[28rem]">
                  Preview is not available for this file type.
                </div>
              ) : previewType === "image" ? (
                <div className="relative flex min-h-[22rem] items-center justify-center bg-slate-950/5 p-4 sm:min-h-[28rem]">
                  {isPreviewLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-slate-600">
                      Loading preview...
                    </div>
                  ) : null}
                  <img
                    src={previewUrl}
                    alt={selectedDocument.fileName}
                    className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                    onLoad={() => setIsPreviewLoading(false)}
                    onError={() => {
                      setIsPreviewLoading(false);
                      setPreviewError("Unable to load this image preview.");
                    }}
                  />
                </div>
              ) : (
                <div className="relative bg-white">
                  {isPreviewLoading ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 text-sm text-slate-600">
                      Loading preview...
                    </div>
                  ) : null}
                  <iframe
                    title={selectedDocument.fileName}
                    src={previewUrl}
                    className="h-[70vh] w-full bg-white"
                    onLoad={() => setIsPreviewLoading(false)}
                  />
                </div>
              )}
            </div>

            {previewError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {previewError}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}