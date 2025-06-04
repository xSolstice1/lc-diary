import {
  Box,
  Flex,
  Heading,
  IconButton,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("teal.500", "teal.700");
  const color = useColorModeValue("white", "gray.200");

  return (
    <Box bg={bg} px={6} py={4} color={color} width="100vw">
      <Flex align="center" justify="space-between">
        <Heading size="md">LeetCode Diary</Heading>
        <IconButton
          aria-label="Toggle color mode"
          icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
          onClick={toggleColorMode}
          variant="ghost"
          color={color}
        />
      </Flex>
    </Box>
  );
}
