import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmingLead, setConfirmingLead] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  const lastFocusRef = useRef(null);

  function handleAuthFailure() {
    localStorage.removeItem("accessToken");
    navigate("/login", { replace: true });
  }

  async function loadLeads() {
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      handleAuthFailure();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthFailure();
          return;
        }
        const data = await response.json().catch(() => ({}));
        setError(data.detail || "Failed to load leads.");
        return;
      }

      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Something went wrong while fetching leads.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function openCreateForm() {
    lastFocusRef.current = document.activeElement;
    setEditingLead(null);
    setSaveError("");
    setIsFormOpen(true);
  }

  function openEditForm(lead) {
    lastFocusRef.current = document.activeElement;
    setEditingLead(lead);
    setSaveError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingLead(null);
    setSaveError("");
    if (
      lastFocusRef.current &&
      typeof lastFocusRef.current.focus === "function"
    ) {
      setTimeout(() => {
        lastFocusRef.current && lastFocusRef.current.focus();
      }, 0);
    }
  }

  async function handleDelete(lead) {
    setConfirmingLead(lead);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!confirmingLead) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      handleAuthFailure();
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/leads/${confirmingLead.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthFailure();
          return;
        }
        const data = await response.json().catch(() => ({}));
        setDeleteError(data.detail || "Failed to delete lead.");
        return;
      }

      setLeads((current) =>
        current.filter((item) => item.id !== confirmingLead.id)
      );
      setConfirmingLead(null);
      if (
        lastFocusRef.current &&
        typeof lastFocusRef.current.focus === "function"
      ) {
        setTimeout(() => {
          lastFocusRef.current && lastFocusRef.current.focus();
        }, 0);
      }
    } catch (err) {
      setDeleteError("Something went wrong while deleting the lead.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSubmit(formValues) {
    setIsSaving(true);
    setSaveError("");

    const token = localStorage.getItem("accessToken");
    if (!token) {
      handleAuthFailure();
      return;
    }

    const url = editingLead
      ? `${API_BASE_URL}/leads/${editingLead.id}/`
      : `${API_BASE_URL}/leads/`;
    const method = editingLead ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthFailure();
          return;
        }
        setSaveError(
          data.detail || "Could not save lead. Please check the form."
        );
        return;
      }

      if (editingLead) {
        setLeads((current) =>
          current.map((item) => (item.id === data.id ? data : item))
        );
      } else {
        setLeads((current) => [data, ...current]);
      }

      closeForm();
    } catch (err) {
      setSaveError("Something went wrong while saving the lead.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (isFormOpen) {
          closeForm();
        } else if (confirmingLead) {
          setConfirmingLead(null);
          if (
            lastFocusRef.current &&
            typeof lastFocusRef.current.focus === "function"
          ) {
            setTimeout(() => {
              lastFocusRef.current && lastFocusRef.current.focus();
            }, 0);
          }
        }
      }
    }

    if (isFormOpen || confirmingLead) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen, confirmingLead]);

  const filteredAndSortedLeads = useMemo(() => {
    let result = Array.isArray(leads) ? [...leads] : [];

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((lead) => {
        const haystack = `${lead.name || ""} ${lead.email || ""} ${
          lead.phone || ""
        } ${lead.source || ""}`.toLowerCase();
        return haystack.includes(term);
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (lead) => String(lead.status || "").toLowerCase() === statusFilter
      );
    }

    if (sortConfig?.key) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return direction === "asc" ? -1 : 1;
        if (bVal == null) return direction === "asc" ? 1 : -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leads, searchTerm, statusFilter, sortConfig]);

  function toggleSort(key) {
    setSortConfig((current) => {
      if (current.key === key) {
        const nextDirection = current.direction === "asc" ? "desc" : "asc";
        return { key, direction: nextDirection };
      }
      return { key, direction: "asc" };
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-10 blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                Leads Management
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Manage and track your leads efficiently
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Lead
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="mb-6">
            <div className="relative rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, phone, source..."
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                  />
                </div>
                <div className="relative sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                  >
                    <option value="all" className="bg-slate-800">All statuses</option>
                    <option value="new" className="bg-slate-800">New</option>
                    <option value="contacted" className="bg-slate-800">Contacted</option>
                    <option value="qualified" className="bg-slate-800">Qualified</option>
                    <option value="won" className="bg-slate-800">Won</option>
                    <option value="lost" className="bg-slate-800">Lost</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8">
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-white/60 text-sm">Loading leads...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/30 p-4">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && leads.length === 0 && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 p-4">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">No leads yet</h3>
                <p className="text-sm text-white/60">Click the <span className="font-semibold text-cyan-400">New Lead</span> button to add your first lead.</p>
              </div>
            </div>
          )}

          {/* Leads Table */}
          {!isLoading && !error && leads.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSort("name")}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                        >
                          Name
                          {sortConfig.key === "name" && (
                            <span className="text-cyan-400">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSort("email")}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                        >
                          Email
                          {sortConfig.key === "email" && (
                            <span className="text-cyan-400">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/70">
                        Phone
                      </th>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSort("source")}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                        >
                          Source
                          {sortConfig.key === "source" && (
                            <span className="text-cyan-400">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSort("status")}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                        >
                          Status
                          {sortConfig.key === "status" && (
                            <span className="text-cyan-400">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-white/70">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {lead.name}
                        </td>
                        <td className="px-6 py-4 text-white/70">{lead.email}</td>
                        <td className="px-6 py-4 text-white/70">
                          {lead.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-white/70">
                          {lead.source || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={lead.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(lead)}
                              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(lead)}
                              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Form Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
              <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-t-3xl"></div>
              <div className="p-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-1">
                  {editingLead ? "Edit Lead" : "Add New Lead"}
                </h2>
                <p className="text-sm text-white/60 mb-4">
                  {editingLead ? "Update lead information" : "Capture lead details to get started"}
                </p>
                {saveError && (
                  <div className="mb-4 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-200">{saveError}</p>
                    </div>
                  </div>
                )}
                <LeadForm
                  initialValues={editingLead}
                  onCancel={closeForm}
                  onSubmit={handleSubmit}
                  isSubmitting={isSaving}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmingLead && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmingLead(null);
              if (
                lastFocusRef.current &&
                typeof lastFocusRef.current.focus === "function"
              ) {
                setTimeout(() => {
                  lastFocusRef.current && lastFocusRef.current.focus();
                }, 0);
              }
            }
          }}
        >
          <div className="relative w-full max-w-sm">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur-xl opacity-30"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
              <div className="h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-t-3xl"></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full bg-red-500/20 p-2">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-white">Delete Lead?</h2>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  This will permanently remove <span className="font-semibold text-white">{confirmingLead.name}</span> and all associated data.
                </p>
                {deleteError && (
                  <div className="mb-4 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/30 px-4 py-2">
                    <p className="text-xs text-red-200">{deleteError}</p>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmingLead(null)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="rounded-lg bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </div>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();

  let gradient = "from-slate-500 to-slate-600";
  let text = "text-slate-300";

  switch (normalized) {
    case "new":
      gradient = "from-cyan-500 to-blue-600";
      text = "text-cyan-300";
      break;
    case "contacted":
      gradient = "from-amber-500 to-orange-600";
      text = "text-amber-300";
      break;
    case "qualified":
      gradient = "from-purple-500 to-pink-600";
      text = "text-purple-300";
      break;
    case "won":
      gradient = "from-emerald-500 to-green-600";
      text = "text-emerald-300";
      break;
    case "lost":
      gradient = "from-red-500 to-rose-600";
      text = "text-red-300";
      break;
    default:
      gradient = "from-slate-500 to-slate-600";
      text = "text-slate-300";
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${gradient} px-3 py-1 text-xs font-semibold ${text} shadow-lg`}>
      {status}
    </span>
  );
}

function LeadForm({ initialValues, onSubmit, onCancel, isSubmitting }) {
  const [name, setName] = useState(initialValues?.name || "");
  const [email, setEmail] = useState(initialValues?.email || "");
  const [phone, setPhone] = useState(initialValues?.phone || "");
  const [source, setSource] = useState(initialValues?.source || "");
  const [status, setStatus] = useState(initialValues?.status || "new");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ name, email, phone, source, status });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
          placeholder="John Doe"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
          placeholder="john@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
          Phone
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
          placeholder="+1 555 123 4567"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
          Source
        </label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
          placeholder="Website, Referral, LinkedIn..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
        >
          <option value="new" className="bg-slate-800">New</option>
          <option value="contacted" className="bg-slate-800">Contacted</option>
          <option value="qualified" className="bg-slate-800">Qualified</option>
          <option value="won" className="bg-slate-800">Won</option>
          <option value="lost" className="bg-slate-800">Lost</option>
        </select>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Lead"
            )}
          </span>
        </button>
      </div>
    </form>
  );
}