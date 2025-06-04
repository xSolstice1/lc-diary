import { Box, Flex, Heading } from "@chakra-ui/react";

export default function Navbar() {
  return (
    <Box bg="teal.500" px={6} py={4} color="white" width="100vw">
      <Flex align="center" justify="center">
        <Heading size="md">LeetCode Diary</Heading>
      </Flex>
    </Box>
  );
}
