import useSelectStore from './store/selectStore.js';
import StartScreen from './pages/startScreen.js';
import GamePanel from './pages/home/index.js'


// ink-gradient
// ink-big-text


export default function App() {
  const showStartScreen = useSelectStore((state) => state.showStartScreen);
  
  return showStartScreen ? <StartScreen /> : <GamePanel />
}
