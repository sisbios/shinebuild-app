'use client';

import { useState, useTransition } from 'react';
import { addServiceItem, deleteServiceItem, toggleServiceItem } from './actions';

interface Item { id: string; name: string; active: boolean; order: number; }

export function ServicesManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!newName.trim()) { setAddError('Enter a service name'); return; }
    setAddError('');
    startTransition(async () => {
      const res = await addServiceItem(newName.trim());
      if (res.error) { setAddError(res.error); return; }
      // Optimistic update
      setItems((prev) => [
        ...prev,
        { id: Date.now().toString(), name: newName.trim(), active: true, order: prev.length + 1 },
      ]);
      setNewName('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteServiceItem(id);
      if (!res.error) setItems((prev) => prev.filter((i) => i.id !== id));
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      const res = await toggleServiceItem(id, !active);
      if (!res.error) setItems((prev) => prev.map((i) => i.id === id ? { ...i, active: !active } : i));
    });
  };

  return (
    <div className="space-y-5">
      {/* Add new */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Add Service / Product</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="e.g. Waterproofing, Civil Work…"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
          />
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="rounded-xl brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 flex-shrink-0"
          >
            Add
          </button>
        </div>
        {addError && <p className="text-xs text-red-600">{addError}</p>}
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            No services added yet. Add your first one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(item.id, item.active)}
                  disabled={isPending}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${item.active ? 'bg-red-600' : 'bg-gray-300'} disabled:opacity-50`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${item.active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>

                <span className={`flex-1 text-sm ${item.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                  {item.name}
                </span>

                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.active ? 'Active' : 'Hidden'}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                  title="Delete"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Hidden items won't appear in the agent lead form. Active items show as checkboxes.
      </p>
    </div>
  );
}
