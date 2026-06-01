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
    <div className="flex flex-col gap-10 lg:flex-row animate-in fade-in duration-1000">
      {/* Category Management Sidebar */}
      <aside className="w-full shrink-0 lg:w-80">
        <div className="sticky top-32 rounded-[2.5rem] p-10 bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold italic animate-in slide-in-from-top-2">
                Log: {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                 <FolderPlus className="h-3 w-3" /> Category Name
              </label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name..."
                className="h-12 bg-white/5 border-white/5 focus:border-blue-500/50 rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/20 px-4 transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-muted-foreground/40 italic flex items-center gap-2">
                 <Info className="h-3 w-3" /> Status
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CategoryStatus)}
              >
                <SelectTrigger id="cat-status" className="h-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/10">
                  <SelectItem value={CategoryStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={CategoryStatus.INACTIVE}>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {loading ? "Processing..." : editingId ? "Update Category" : "Add Category"}
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={cancelEdit}
                  className="h-12 w-full rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-white/5"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="mt-12 p-6 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10">
             <p className="text-[9px] leading-relaxed text-muted-foreground/60 font-medium italic">
                Manage your catalog categories. These appear in job creation and filtering across the platform.
             </p>
          </div>
        </div>
      </aside>

      {/* Categories Main List Area */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-3">
             <p className="text-3xl font-bold text-foreground tracking-tighter tabular-nums">
               {initialCategories.length} <span className="text-sm font-semibold text-blue-500 opacity-60 ml-2">Available</span>
             </p>
             <p className="text-xs font-semibold text-muted-foreground/40 italic">
                Category Master Grid
             </p>
          </div>
          
          {/* Search and Export */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-12 px-6 rounded-2xl text-xs font-semibold gap-2 bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-foreground shrink-0"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 opacity-50" />
               <Input
                 placeholder="Search categories..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="h-12 pl-12 bg-white/5 border-white/5 rounded-2xl text-xs font-semibold text-foreground placeholder:text-muted-foreground/20 px-4 transition-all"
               />
            </div>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="linear-card rounded-[3rem] p-32 text-center border-dashed border-white/10">
             <p className="text-lg font-bold text-muted-foreground/40 italic leading-relaxed">
               {searchTerm ? "No categories found matching your search." : "No categories found."}<br />
               {searchTerm ? "Try a different keyword." : "Add a new category in the sidebar."}
             </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCategories.map((c, idx) => (
              <div
                key={c.id}
                className="group flex items-start justify-between gap-6 rounded-[2.5rem] bg-gradient-to-br from-blue-50 to-orange-50 border border-blue-200 p-8 transition-all hover:shadow-md hover:border-blue-300 animate-in fade-in slide-in-from-bottom-5 duration-700"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-8 min-w-0 flex-1">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-white/5 border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                     <FolderTree className="h-6 w-6 text-blue-500 scale-90 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold text-foreground tracking-tighter group-hover:text-blue-500 transition-colors truncate">
                       {c.name}
                     </h3>
                     <div className="flex items-center gap-4 mt-2 tabular-nums">
                        <span className="text-xs font-semibold text-muted-foreground/30 italic">Created {new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-white/5" />
                        <div className="flex items-center gap-2">
                           <span className={`h-1.5 w-1.5 rounded-full ${c.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                           <span className={`text-xs font-semibold ${c.status === "ACTIVE" ? "text-emerald-400" : "text-amber-400"}`}>
                            {c.status}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(c)}
                    className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/20 transition-all active:scale-95"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95"
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
