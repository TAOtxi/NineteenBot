import { create } from 'zustand';

interface SelectStoreState {
  showStartScreen: boolean;
  launchWay: 'withTask' | 'single';
  botList: string[];
  taskList: string[];
  server: string;

  setShowStartScreen: (show: boolean) => void;
  setLaunchWay: (way: 'withTask' | 'single') => void;
  setBotList: (list: string[]) => void;
  setTaskList: (taskList: string[]) => void;
  setServer: (server: string) => void;
}


export default create<SelectStoreState>((set) => ({
  showStartScreen: true,
  launchWay: 'single',
  botList: [],
  taskList: [],
  server: '',

  setShowStartScreen: (show) => set({ showStartScreen: show }),
  setLaunchWay: (launchWay) => set({ launchWay }),
  setBotList: (botList) => set({ botList }),
  setTaskList: (taskList) => set({ taskList }),
  setServer: (server) => set({ server }),
}));
