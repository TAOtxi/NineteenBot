import { Text, useInput, Box, useApp } from 'ink';
import React, { useState, useCallback, useMemo } from 'react';
import ContainerBox from './ContainerBox.js';


interface SelectListProps {
  title: string;
  options: string[];
  onSubmit: (selectList: number[]) => void;
  onCancel?: () => void;
  multiple?: boolean;
}

export default function SelectList(
  { 
    title, 
    options, 
    onSubmit,
    onCancel,
    multiple = false 
  }: SelectListProps
) {
	const [selectList, setSelectList] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const { exit } = useApp();

  const resetState = useCallback(() => {
    setSelectList([]);
    setCurrentIndex(0);
  }, []);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      exit();
      return;
    }
    if (key.upArrow || key.downArrow) {
      let newIndex = key.upArrow ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0) newIndex = options.length - 1;
      if (newIndex >= options.length) newIndex = 0;
      setCurrentIndex(newIndex);
    }

    else if (key.return) {
      if (multiple && selectList.length > 0) {
        onSubmit(selectList);
        resetState();
      } else if (!multiple) {
        onSubmit([currentIndex]);
        resetState();
      }
    }

    else if (key.escape) {
      onCancel?.();
      resetState();
    }

    else if (multiple && input === ' ') {
      setSelectList(
        selectList.includes(currentIndex) ? 
          selectList.filter((item) => item !== currentIndex) : [...selectList, currentIndex]
      );
    }
  });

  const { width, height } = useMemo(() => {
    return {
      width: Math.max(...options.map((item) => item.length), 26),
      height: Math.max(options.length + 1, 6)
    }
  }, [options])

  const maxLength = Math.max(...options.map((item) => item.length));

  return (
    <ContainerBox width={width} height={height} title={title}>
      <Box flexDirection="column">
        {options.map((item, index) => {
          const marker = selectList.includes(index) ? ' ◯ ' : '   ';
          const content = currentIndex === index ? `${marker}${item.padEnd(maxLength)}   ↩` : `${marker}${item}`;

          return (
            <Text
              key={index}
            >
              {content}
            </Text>
          )
        })}
      </Box>
    </ContainerBox>
  )
}