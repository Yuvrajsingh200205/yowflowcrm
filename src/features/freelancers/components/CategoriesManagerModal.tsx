import React, { useState } from 'react';
import { FreelancerCategory } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { X, Plus, Edit2, Trash2, CheckCircle, XCircle, Tag, Layers } from 'lucide-react';

interface CategoriesManagerModalProps {
  categories: FreelancerCategory[];
  onSaveCategories: (categories: FreelancerCategory[]) => void;
  onClose: () => void;
}

export const CategoriesManagerModal: React.FC<CategoriesManagerModalProps> = ({
  categories,
  onSaveCategories,
  onClose,
}) => {
  const [catList, setCatList] = useState<FreelancerCategory[]>(categories);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [deletingCat, setDeletingCat] = useState<{ id: string; name: string } | null>(null);

  // Form states for new category
  const [newCatName, setNewCatName] = useState('');
  const [newSubCats, setNewSubCats] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Form states for editing category
  const [editCatName, setEditCatName] = useState('');
  const [editSubCats, setEditSubCats] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const subs = newSubCats
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const created: FreelancerCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      subCategories: subs.length > 0 ? subs : ['General'],
      isActive: true,
      description: newDesc.trim(),
    };

    const updated = [...catList, created];
    setCatList(updated);
    onSaveCategories(updated);

    setNewCatName('');
    setNewSubCats('');
    setNewDesc('');
  };

  const handleStartEdit = (cat: FreelancerCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditSubCats(cat.subCategories.join(', '));
    setEditDesc(cat.description || '');
  };

  const handleSaveEdit = (id: string) => {
    const subs = editSubCats
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = catList.map((c) =>
      c.id === id
        ? {
            ...c,
            name: editCatName.trim(),
            subCategories: subs.length > 0 ? subs : c.subCategories,
            description: editDesc.trim(),
          }
        : c
    );

    setCatList(updated);
    onSaveCategories(updated);
    setEditingCatId(null);
  };

  const handleToggleActive = (id: string) => {
    const updated = catList.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setCatList(updated);
    onSaveCategories(updated);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setDeletingCat({ id, name });
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#111a18]/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2rem] shadow-[0_30px_90px_rgba(9,19,17,.42)] border border-white/50 w-full max-w-3xl overflow-hidden my-8">
        <div className="bg-[linear-gradient(125deg,#33514A,#55333f_52%,#1b2825)] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-white">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Freelancer Categories</h2>
              <p className="text-xs text-[#dfeae7]">Photography, cinema, drone, editing and custom studio roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#2f5f54]" />
              <span>Add New Freelancer Category</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Drone Operator, Sound Engineer"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#366e61] bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Sub-Categories (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Candid, Traditional, Operator"
                  value={newSubCats}
                  onChange={(e) => setNewSubCats(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#366e61] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Description / Scope
              </label>
              <input
                type="text"
                placeholder="Brief description of requirements..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#366e61] bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#2f5f54] hover:bg-[#254b42] text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* List of Existing Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Active & Defined Categories ({catList.length})</span>
            </h3>

            {catList.map((cat) => {
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border transition ${
                    cat.isActive
                      ? 'bg-white border-slate-200 hover:border-rose-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Category Name</label>
                          <input
                            type="text"
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">Sub-Categories</label>
                          <input
                            type="text"
                            value={editSubCats}
                            onChange={(e) => setEditSubCats(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Description</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-3 py-1 bg-[#2f5f54] text-white text-xs font-bold rounded"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{cat.name}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${
                              cat.isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleActive(cat.id)}
                            title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                            className={`p-1.5 rounded transition ${
                              cat.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {cat.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleStartEdit(cat)}
                            title="Edit Category"
                            className="p-1.5 text-slate-600 hover:text-[#2f5f54] hover:bg-rose-50 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            title="Delete Category"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-600 mt-1">{cat.description}</p>
                      )}

                      <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sub-Categories:</span>
                        {cat.subCategories.map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-rose-50 text-[#254b42] border border-rose-200 rounded-md text-[11px] font-semibold"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deletingCat}
        title="Delete Category"
        itemTitle={deletingCat?.name}
        message={deletingCat ? `Are you sure you want to delete category "${deletingCat.name}"?` : ''}
        onConfirm={() => {
          if (deletingCat) {
            const updated = catList.filter((c) => c.id !== deletingCat.id);
            setCatList(updated);
            onSaveCategories(updated);
          }
          setDeletingCat(null);
        }}
        onCancel={() => setDeletingCat(null)}
      />
    </div>
  );
};
