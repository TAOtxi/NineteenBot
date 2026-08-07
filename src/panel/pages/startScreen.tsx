import SelectList from '../components/selectList.js';
import useSelectStore from '../store/selectStore.js';
import { useCallback, useMemo, useState } from 'react';


const selectConfig = {
  useWay: {
    title: ' Use Way ',
    options: ['withTask', 'single'],
  },
  botList: {
    title: ' Select Bot List ',
    options: ['item1', 'item2', 'item3', 'item4'],
  },
  taskList: {
    title: ' Select Task ',
    options: ['task1', 'task2', 'task3', 'task4'],
  },
  serverList: {
    title: ' Select Server ',
    options: ['server1', 'server2', 'server3', 'server4'],
  },
}

interface SelectConfig {
  title: string;
  options: string[];
  multiple: boolean;
}


export default function StartScreen() {
  const launchWay = useSelectStore((state) => state.launchWay);
  const setLaunchWay = useSelectStore((state) => state.setLaunchWay);
  const setBotList = useSelectStore((state) => state.setBotList);
  const setTaskList = useSelectStore((state) => state.setTaskList);
  const setServer = useSelectStore((state) => state.setServer);
  const setShowStartScreen = useSelectStore((state) => state.setShowStartScreen);

  const [currentStep, setCurrentStep] = useState<number>(1);
  

  const config = useMemo<SelectConfig>(() => {
    const isWithTask = launchWay === 'withTask';

    if (currentStep === 1) {
      return {...selectConfig.useWay, multiple: false};
    }
    if (currentStep === 2) {
      return {...selectConfig.botList, multiple: isWithTask};
    }
    
    if (currentStep === 3) {
      return {...selectConfig.serverList, multiple: false};
    }

    if (!isWithTask) {
      throw new Error('single mode not support');
    }

    // step4
    return {...selectConfig.taskList, multiple: true};
    

  }, [currentStep, launchWay]);

  const onSubmit = useCallback((selectList: number[]) => {
    const selectContent = selectList.map((item) => config.options[item]) as string[];
    if (selectContent[0] === undefined) {
      throw new Error('invalid select');
    }

    if (currentStep === 1) {
      setLaunchWay(selectContent[0] as 'withTask' | 'single');
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      setBotList(selectContent);
      setCurrentStep(3);
      return;
    }
    const isWithTask = launchWay === 'withTask';
    if (currentStep === 3) {
      setServer(selectContent[0]);
      if (!isWithTask) {
        setShowStartScreen(false);
        // do something...
        return;
      }
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      setTaskList(selectContent);
      setShowStartScreen(false);
      // do something...
      return;
    }
    throw new Error(`invalid step ${currentStep}`);
  }, [currentStep, launchWay]);

  return (
    <SelectList {...config} onSubmit={onSubmit} />
  )
}