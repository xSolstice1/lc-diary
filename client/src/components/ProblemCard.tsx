import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stack,
  Button,
  Text,
  Wrap,
  WrapItem,
  Tag,
  Flex,
} from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";
import type { Problem } from "../types/Problems";

interface ProblemCardProps {
  problem: Problem;
  onEdit: (problem: Problem) => void;
  onDelete: (id: string) => void;
}

export default function ProblemCard({
  problem,
  onEdit,
  onDelete,
}: ProblemCardProps) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={4} boxShadow="sm">
      <Flex align="center" mb={1}>
        <Box fontWeight="bold" fontSize="lg" flex="1">
          {problem.title}
        </Box>
        {problem.completed && (
          <FaCheckCircle
            color="green"
            size={24}
            style={{ marginLeft: 8 }}
            aria-label="Completed"
          />
        )}
      </Flex>

      <Box color="gray.500" mb={1}>
        LeetCode #{problem.lcnumber}
      </Box>

      <Box mb={3}>
        <Wrap spacing={2} align="center">
          {problem.tags &&
            problem.tags.length > 0 &&
            problem.tags.map((tag) => (
              <WrapItem key={tag}>
                <Tag size="sm" variant="subtle" colorScheme="blue">
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          {problem.difficulty && (
            <WrapItem>
              <Tag
                size="sm"
                variant="solid"
                colorScheme={
                  problem.difficulty.toLowerCase() === "easy"
                    ? "green"
                    : problem.difficulty.toLowerCase() === "medium"
                    ? "yellow"
                    : "red"
                }
              >
                {problem.difficulty}
              </Tag>
            </WrapItem>
          )}
        </Wrap>
      </Box>

      <Accordion allowMultiple>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                Solution
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel
            pb={4}
            whiteSpace="pre-wrap"
            fontFamily="monospace"
            bg="gray.800"
            color="white"
            p={4}
            borderRadius="md"
            overflowX="auto"
            fontSize="sm"
          >
            {problem.solution || "No solution provided."}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                Notes
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel
            pb={4}
            whiteSpace="pre-wrap"
            fontFamily="monospace"
            bg="gray.800"
            color="white"
            p={4}
            borderRadius="md"
            overflowX="auto"
            fontSize="sm"
          >
            {problem.notes || "No notes provided."}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Stack direction="row" spacing={2} mt={4}>
        <Button size="sm" onClick={() => onEdit(problem)}>
          Edit
        </Button>
        <Button
          size="sm"
          colorScheme="red"
          onClick={() => onDelete(problem.id)}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}
