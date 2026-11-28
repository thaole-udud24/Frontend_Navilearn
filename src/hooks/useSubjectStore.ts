import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { getSubjectId } from '@/lib/subjectUtils';
import { listAllStudentSubjects } from '@/services/student-subject/student-subject.api';
import type { StudentSubject } from '@/services/student-subject/types';

function readStoredSubjectId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_SUBJECT_ID);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

function writeStoredSubjectId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_SUBJECT_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_SUBJECT_ID);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

interface SubjectStoreState {
  selectedSubjectId: string | null;
  subjects: StudentSubject[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  loadSubjects: (force?: boolean) => Promise<void>;
  reset: () => void;
}

let inflightRequest: Promise<void> | null = null;

export const useSubjectStore = create<SubjectStoreState>((set, get) => ({
  selectedSubjectId: readStoredSubjectId(),
  subjects: [],
  loading: false,
  loaded: false,
  error: null,

  setSelectedSubjectId: (id) => {
    const normalized = id && id.trim() ? id : null;
    writeStoredSubjectId(normalized);
    set({ selectedSubjectId: normalized });
  },

  loadSubjects: async (force = false) => {
    const state = get();
    if (!force && state.loaded && !state.error) return;
    if (inflightRequest && !force) return inflightRequest;

    set({ loading: true, error: null });
    inflightRequest = listAllStudentSubjects()
      .then((items) => {
        const currentSelected = get().selectedSubjectId;
        const validIds = new Set(items.map(getSubjectId).filter((id): id is string => Boolean(id)));
        // Clear stale selection if the student no longer has access to that subject
        const nextSelected = currentSelected && validIds.has(currentSelected) ? currentSelected : null;
        if (nextSelected !== currentSelected) {
          writeStoredSubjectId(nextSelected);
        }
        set({
          subjects: items,
          selectedSubjectId: nextSelected,
          loading: false,
          loaded: true,
          error: null,
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách môn học';
        set({ loading: false, error: message });
      })
      .finally(() => {
        inflightRequest = null;
      });

    return inflightRequest;
  },

  reset: () => {
    writeStoredSubjectId(null);
    inflightRequest = null;
    set({
      selectedSubjectId: null,
      subjects: [],
      loading: false,
      loaded: false,
      error: null,
    });
  },
}));

/** Convenience hook that auto-loads subjects once and exposes derived subject helpers. */
export function useSelectedSubject() {
  const selectedSubjectId = useSubjectStore((s) => s.selectedSubjectId);
  const subjects = useSubjectStore((s) => s.subjects);
  const loading = useSubjectStore((s) => s.loading);
  const loaded = useSubjectStore((s) => s.loaded);
  const error = useSubjectStore((s) => s.error);
  const setSelectedSubjectId = useSubjectStore((s) => s.setSelectedSubjectId);
  const loadSubjects = useSubjectStore((s) => s.loadSubjects);

  useEffect(() => {
    if (!loaded && !loading) {
      void loadSubjects();
    }
  }, [loaded, loading, loadSubjects]);

  const catalogSubjects = useMemo(
    () => subjects.filter((s) => Boolean(getSubjectId(s))),
    [subjects],
  );

  const selectedSubject = useMemo(
    () => catalogSubjects.find((s) => getSubjectId(s) === selectedSubjectId) ?? null,
    [catalogSubjects, selectedSubjectId],
  );

  return {
    selectedSubjectId,
    setSelectedSubjectId,
    selectedSubject,
    subjects,
    catalogSubjects,
    loading,
    loaded,
    error,
    reload: () => loadSubjects(true),
  };
}
