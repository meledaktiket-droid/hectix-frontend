"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, ImageIcon, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

type Banner = {
  id: string;
  tag: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

type FormState = {
  tag: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  tag: "",
  description: "",
  imageUrl: "",
  displayOrder: 0,
  isActive: true,
};

async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder: "banners",
    }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { url, publicUrl } = await res.json();
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return publicUrl;
}

function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <ImageIcon className="size-6" />
            <span className="text-xs">{uploading ? "Uploading…" : "Click to upload"}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-xs text-muted-foreground">Uploading…</span>
          </div>
        )}
        {value && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <span className="text-xs font-medium text-white">Change image</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function BannerForm({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Image</label>
        <ImageUpload
          value={form.imageUrl}
          onChange={(url) => onChange({ ...form, imageUrl: url })}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tag</label>
        <Input
          value={form.tag}
          onChange={(e) => onChange({ ...form, tag: e.target.value })}
          placeholder="e.g. Fitur komentar"
          maxLength={60}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Short description shown on the slide"
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1.5">
          <label className="text-sm font-medium">Display order</label>
          <Input
            type="number"
            value={form.displayOrder}
            onChange={(e) => onChange({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
            min={0}
          />
        </div>

        <div className="flex flex-col justify-end pb-0.5">
          <label className="mb-2 text-sm font-medium">Active</label>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => onChange({ ...form, isActive: !form.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              form.isActive ? "bg-[#2a8af6]" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                form.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const queryClient = useQueryClient();

  const {
    data: banners = [],
    isLoading: loading,
    isError: error,
    refetch,
  } = useQuery<Banner[]>({
    queryKey: ["admin-banners"],
    queryFn: ({ signal }) =>
      fetch("/api/banners", { signal }).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [createError, setCreateError] = useState("");

  const [editTarget, setEditTarget] = useState<Banner | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editError, setEditError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createMutation = useMutation<Banner, Error, FormState>({
    mutationFn: async (form) => {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
    onError: () => {
      setCreateError("Failed to create banner. Try again.");
    },
  });

  const editMutation = useMutation<Banner, Error, { id: string; form: FormState }>({
    mutationFn: async ({ id, form }) => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setEditTarget(null);
    },
    onError: () => {
      setEditError("Failed to save changes. Try again.");
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await fetch(`/api/banners/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setDeleteId(null);
    },
  });

  const createSaving = createMutation.isPending;
  const editSaving = editMutation.isPending;
  const deleting = deleteMutation.isPending;

  function handleCreate() {
    if (!createForm.tag || !createForm.description || !createForm.imageUrl) {
      setCreateError("Please fill in all fields and upload an image.");
      return;
    }
    setCreateError("");
    createMutation.mutate(createForm);
  }

  function openEdit(b: Banner) {
    setEditTarget(b);
    setEditForm({
      tag: b.tag,
      description: b.description,
      imageUrl: b.imageUrl,
      displayOrder: b.displayOrder,
      isActive: b.isActive,
    });
    setEditError("");
  }

  function handleEdit() {
    if (!editTarget) return;
    if (!editForm.tag || !editForm.description || !editForm.imageUrl) {
      setEditError("Please fill in all fields.");
      return;
    }
    setEditError("");
    editMutation.mutate({ id: editTarget.id, form: editForm });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
  }

  const deleteName = banners.find((b) => b.id === deleteId)?.tag ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banners</h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-muted-foreground">{banners.length} banner{banners.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Button onClick={() => { setCreateOpen(true); setCreateForm(EMPTY_FORM); setCreateError(""); }}>
          <Plus className="size-4" /> Add Banner
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium">Failed to load banners</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : loading ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Banner</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Created</th>
                <th className="px-4 py-3 w-px" />
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="size-10 rounded-md bg-muted animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-2.5 w-40 rounded bg-muted animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="h-3.5 w-6 rounded bg-muted animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-14 rounded-full bg-muted animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-3.5 w-20 rounded bg-muted animate-pulse" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ImageIcon className="size-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No banners yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add your first banner to display in the featured carousel.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12" />
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Banner</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Created</th>
                <th className="px-4 py-3 w-px" />
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative size-10 overflow-hidden rounded-md bg-muted shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.imageUrl} alt={b.tag} className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-0 w-full">
                    <p className="font-medium truncate">{b.tag}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{b.description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="size-3.5 text-muted-foreground/40" />
                      {b.displayOrder}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {b.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-muted-foreground/40" />Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(b.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Banner</DialogTitle>
          </DialogHeader>
          <BannerForm form={createForm} onChange={setCreateForm} />
          {createError && <p className="text-xs text-destructive">{createError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createSaving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSaving}>
              {createSaving ? "Saving…" : "Add Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>
          <BannerForm form={editForm} onChange={setEditForm} />
          {editError && <p className="text-xs text-destructive">{editError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editSaving}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-medium text-foreground">"{deleteName}"</span>? This can be undone by a developer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
