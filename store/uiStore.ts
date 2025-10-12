import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

interface UIStore {
  // Settings
  settings: AppSettings;
  
  // UI State
  sidebarOpen: boolean;
  currentView: 'timeline' | 'list';
  filterTags: string[];
  filterStatus: string[];
  searchQuery: string;
  
  // Modal states
  isCreateRoadmapModalOpen: boolean;
  isCreateObjectiveModalOpen: boolean;
  isSettingsModalOpen: boolean;
  
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSidebar: () => void;
  setCurrentView: (view: 'timeline' | 'list') => void;
  setFilterTags: (tags: string[]) => void;
  setFilterStatus: (status: string[]) => void;
  setSearchQuery: (query: string) => void;
  
  // Modal actions
  openCreateRoadmapModal: () => void;
  closeCreateRoadmapModal: () => void;
  openCreateObjectiveModal: () => void;
  closeCreateObjectiveModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  
  // Reset filters
  resetFilters: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      settings: {
        theme: 'auto',
        defaultView: 'timeline',
        firstDayOfWeek: 1,
        dateFormat: 'MMM d, yyyy',
        showWeekNumbers: false
      },
      
      sidebarOpen: false,
      currentView: 'timeline',
      filterTags: [],
      filterStatus: [],
      searchQuery: '',
      
      isCreateRoadmapModalOpen: false,
      isCreateObjectiveModalOpen: false,
      isSettingsModalOpen: false,
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),
      
      setCurrentView: (view) => set({ currentView: view }),
      
      setFilterTags: (tags) => set({ filterTags: tags }),
      
      setFilterStatus: (status) => set({ filterStatus: status }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      openCreateRoadmapModal: () => set({ isCreateRoadmapModalOpen: true }),
      closeCreateRoadmapModal: () => set({ isCreateRoadmapModalOpen: false }),
      
      openCreateObjectiveModal: () => set({ isCreateObjectiveModalOpen: true }),
      closeCreateObjectiveModal: () => set({ isCreateObjectiveModalOpen: false }),
      
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),
      
      resetFilters: () => set({
        filterTags: [],
        filterStatus: [],
        searchQuery: ''
      })
    }),
    {
      name: 'planner-ui-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        currentView: state.currentView
      })
    }
  )
);
