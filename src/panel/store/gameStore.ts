import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface GameStoreState {
  chatBoxContent: string[];
  chatBoxScrollIndex: number;
  addChatBoxContent: (content: string) => void;

  logBoxContent: string[];
  logBoxScrollIndex: number;
  addLogBoxContent: (content: string) => void;
}

const maxContentLength = 1000;

export default create<GameStoreState>()(
  immer((set) => ({
    chatBoxContent: [],
    chatBoxScrollIndex: 0,
    addChatBoxContent: (content) => {
      set((state) => {
        const inTail = state.chatBoxScrollIndex === state.chatBoxContent.length - 1;
        if (state.chatBoxContent.length > maxContentLength) {
          state.chatBoxContent.shift();
          state.chatBoxScrollIndex--;
        }
        state.chatBoxContent.push(content);
        state.chatBoxScrollIndex = state.chatBoxContent.length - 1;
      });
    },

    logBoxContent: [],
    logBoxScrollIndex: 0,
    addLogBoxContent: (content) => {
      set((state) => {
        if (state.logBoxContent.length > maxContentLength) {
          state.logBoxContent.shift();
          state.logBoxScrollIndex--;
        }
        state.logBoxContent.push(content);
        state.logBoxScrollIndex = state.logBoxContent.length - 1;
      });
    },
  }))
)
