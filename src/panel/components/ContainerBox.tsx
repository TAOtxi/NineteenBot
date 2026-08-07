import { Box, Text } from 'ink';
import { useState, type ReactNode } from 'react';

interface ContainerProps {
  width: number;
  height: number;
  title: string;
  left?: number;
  top?: number;
  children?: ReactNode;
}

// 生成一个随机的、亮度适中的十六进制颜色（避免太暗看不清边框）
function randomColor(): string {
  const channel = () => Math.floor(80 + Math.random() * 176); // 80~255
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(channel())}${hex(channel())}${hex(channel())}`;
}

export default function ContainerBox({ width, height, title, children, left = 0, top = 0 }: ContainerProps) {
  const [color] = useState(randomColor);

  return (
    <Box position="relative" width={width} height={height} marginLeft={left} marginTop={top}>
      <Box
        borderStyle="round"
        borderColor={color}
        width={width}
        height={height}
        paddingX={1}
      >
        {children}
      </Box>

      <Box position="absolute" marginTop={0} marginLeft={2}>
        <Text color={color}>{ title }</Text>
      </Box>
    </Box>
  );
}
