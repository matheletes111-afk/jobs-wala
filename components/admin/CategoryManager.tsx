"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryStatus } from "@prisma/client";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";

export interface CategoryRow {
  id: string;
  name: string;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export default function CategoryManager({
  initialCategories,
}: {
  initialCategories: CategoryRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CategoryStatus>(CategoryStatus.ACTIVE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      setName("");
      setStatus(CategoryStatus.ACTIVE);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setEditingId(null);
      setName("");
      setStatus(CategoryStatus.ACTIVE);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Delete this category? Jobs using it will keep the category name as text."
      )
    )
      return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      if (editingId === id) {
        setEditingId(null);
        setName("");
        setStatus(CategoryStatus.ACTIVE);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c: CategoryRow) => {
    setEditingId(c.id);
    setName(c.name);
    setStatus(c.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setStatus(CategoryStatus.ACTIVE);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FolderTree className="h-5 w-5 text-[#2563eb]" />
          {editingId ? "Edit Category" : "Add Category"}
        </h2>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="cat-name" className="text-gray-600">
              Name
            </Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Technology"
              className="w-48 rounded-lg border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-status" className="text-gray-600">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as CategoryStatus)}
            >
              <SelectTrigger id="cat-status" className="w-36 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CategoryStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={CategoryStatus.INACTIVE}>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#2563eb] hover:bg-[#1d4ed8]"
          >
            <Plus className="mr-2 h-4 w-4" />
            {editingId ? "Update" : "Create"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500">
            {initialCategories.length} categor
            {initialCategories.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {initialCategories.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No categories yet. Create one above.
            </div>
          ) : (
            initialCategories.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      c.status === CategoryStatus.ACTIVE
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(c)}
                    disabled={loading}
                    className="border-gray-300"
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(c.id)}
                    disabled={loading}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
