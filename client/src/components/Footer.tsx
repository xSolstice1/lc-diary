import { Box, Flex, Text, Link, Icon } from "@chakra-ui/react";
import { FaCodeBranch, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <Box bg="gray.800" color="gray.200" py={4} mt="auto">
      <Flex direction="column" align="center" justify="center">
        <Text fontSize="sm" mb={2}>
          © {new Date().getFullYear()} Ang Jin Wei. All rights reserved.
        </Text>
        <Flex gap={4}>
          <Link href="https://github.com/xsolstice1" isExternal>
            <Flex align="center" gap={1}>
              <Icon as={FaGithub} />
              <Text>GitHub</Text>
            </Flex>
          </Link>
          <Link href="https://github.com/xSolstice1/lc-diary" isExternal>
            <Flex align="center" gap={1}>
              <Icon as={FaCodeBranch} />
              <Text>Project Repository</Text>
            </Flex>
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
}
