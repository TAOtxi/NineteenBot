import { Box, Text } from 'ink';
import ContainerBox from './ContainerBox.js';
import { memo } from 'react'

export interface ContentItem {
  text: string,
  id: string
}


interface ScrollBoxProps {
  title: string;
  buffer: ContentItem[];
  showOffset: number;
  height: number;
  width: number;
}

function ScrollBox({
  title,
  buffer,
  showOffset,
  height,
  width
}: ScrollBoxProps) {

  let startShowIndex = showOffset;
  if (startShowIndex + height > buffer.length) {
    startShowIndex = buffer.length - height;
  }
  if (startShowIndex < 0) {
    startShowIndex = 0;
  }
  
  return (
    <ContainerBox title={title} width={width} height={height}>
      <Box flexDirection='column' overflowY='hidden'>
        {buffer.slice(startShowIndex, startShowIndex + height).map((item) => (
          <Box key={item.id}>
            <Text>{item.text}</Text>
          </Box>
        ))}
      </Box>
    </ContainerBox>
  )
}

export default memo(ScrollBox)