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
import { FolderTree, Pencil, Trash2, FolderPlus, Info, Search, Download } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setStatus(CategoryStatus.ACTIVE);
    setError("");
  };

  const filteredCategories = initialCategories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredCategories.length === 0) return;
    const headers = ["ID", "Name", "Status", "Created At", "Updated At"];

    const rows = filteredCategories.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.status,
      c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : "",
      c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `categories_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-10 lg:flex-row animate-in fade-in duration-700">
      {/* Category Management Sidebar */}
      <aside className="w-full shrink-0 lg:w-80">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-32 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-250 text-red-650 text-xs font-semibold whitespace-pre-wrap">
                Log: {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Category Name
              </label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name..."
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CategoryStatus)}
              >
                <SelectTrigger id="cat-status" className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  <SelectItem value={CategoryStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={CategoryStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                loading={loading}
                className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <span style={{ color: "white" }}>
                  {editingId ? "Update Category" : "Add Category"}
                </span>
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={cancelEdit}
                  className="h-11 w-full rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
             <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                Manage your catalog categories. These appear in job creation and filtering across the platform.
             </p>
          </div>
        </div>
      </aside>

      {/* Categories Main List Area */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200/60 pb-6">
          <div className="space-y-1">
             <p className="text-xl font-bold text-slate-900 tracking-tight">
               {initialCategories.length} <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-2">Available</span>
             </p>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Category Master Grid
             </p>
          </div>
          
          {/* Search and Export */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-11 px-5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 gap-2 shrink-0"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
               <Input
                 placeholder="Search categories..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="h-11 pl-10 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-xs font-medium text-slate-700"
               />
            </div>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm">
             <p className="text-sm font-semibold text-slate-400 italic">
               {searchTerm ? "No categories found matching your search." : "No categories found."}
             </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCategories.map((c, idx) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 group flex items-center justify-between gap-6 rounded-2xl shadow-sm p-5 transition-all hover:shadow-md hover:border-blue-500/50 animate-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-55 border border-blue-100 text-blue-600 transition-all">
                     <FolderTree className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors truncate">
                       {c.name}
                     </h3>
                     <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs font-semibold text-slate-400">Created {new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <div className="flex items-center gap-1.5">
                           <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-all ${
                             c.status === "ACTIVE" 
                               ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                               : "bg-amber-50 text-amber-600 border-amber-200"
                           }`}>
                            {c.status}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(c)}
                    className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-500/50 hover:bg-blue-50 transition-all"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-500/50 hover:bg-red-50 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
