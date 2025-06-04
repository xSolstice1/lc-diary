import { Box, Badge, Button, Flex, Text } from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";  // react-icons FaCheckCircle
import type { Problem } from "../types/Problems";

interface Props {
  problem: Problem;
  onEdit: (problem: Problem) => void;
  onDelete: (id: string) => void;
}

export default function ProblemCard({ problem, onEdit, onDelete }: Props) {
  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm">
      <Flex justify="space-between" align="center" mb={2}>
        <Box>
          <Text fontWeight="bold">{problem.title} (#{problem.lcnumber})</Text>
          <Badge
            colorScheme={
              problem.difficulty === "Easy"
                ? "green"
                : problem.difficulty === "Medium"
                ? "yellow"
                : "red"
            }
          >
            {problem.difficulty}
          </Badge>
        </Box>

        {/* Big green tick if completed */}
        {problem.completed && (
          <Box
            as={FaCheckCircle}
            color="green"
            fontSize="2rem"
            aria-label="Completed"
            title="Completed"
          />
        )}
      </Flex>

      {/* Solution */}
      {problem.solution && (
        <Box mb={2}>
          <Text fontWeight="semibold">Solution:</Text>
          <Text whiteSpace="pre-wrap" fontSize="sm">
            {problem.solution}
          </Text>
        </Box>
      )}

      {/* Notes */}
      {problem.notes && (
        <Box mb={2}>
          <Text fontWeight="semibold">Notes:</Text>
          <Text whiteSpace="pre-wrap" fontSize="sm" color="gray.600">
            {problem.notes}
          </Text>
        </Box>
      )}

      {/* Tags */}
      {problem.tags.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={1}>
            Tags:
          </Text>
          <Flex gap={2} wrap="wrap">
            {problem.tags.map((tag, idx) => (
              <Badge key={idx} colorScheme="blue">
                {tag}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      <Flex gap={2} mt={4}>
        <Button size="sm" onClick={() => onEdit(problem)}>
          Edit
        </Button>
        <Button size="sm" colorScheme="red" onClick={() => onDelete(problem.id)}>
          Delete
        </Button>
      </Flex>
    </Box>
  );
}
