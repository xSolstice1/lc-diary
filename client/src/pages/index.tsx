import { useEffect, useState, useContext, useMemo } from "react";
import {
  Box,
  Stack,
  Button,
  Container,
  Spinner,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  CheckboxGroup,
  Heading,
  Divider,
  Wrap,
  WrapItem,
  useDisclosure,
  Collapse,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tag,
  TagLabel,
  TagRightIcon,
  Flex,
  HStack,
} from "@chakra-ui/react";
import ActivityMap from "../components/activtityMap";
import { FaSearch, FaChartBar } from "react-icons/fa";
import Navbar from "../components/Navbar";
import ProblemCard from "../components/ProblemCard";
import ProblemForm from "../components/ProblemForm";
import type { Problem } from "../types/Problems";
import { AuthContext } from "../auth/AuthContext";
import { exportToCSV } from "../utils/ExportToCSV";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function Home() {
  const { token } = useContext(AuthContext);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [editing, setEditing] = useState<Problem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const { isOpen: isTagsOpen, onToggle: toggleTags } = useDisclosure();
  const { isOpen: isDifficultiesOpen, onToggle: toggleDifficulties } =
    useDisclosure();
  const {
    isOpen: isStatsOpen,
    onOpen: onStatsOpen,
    onClose: onStatsClose,
  } = useDisclosure();

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSelectedDifficulties([]);
  };

  useEffect(() => {
    if (token) {
      fetchProblems();
    } else {
      setProblems([]);
      setFilteredProblems([]);
    }
  }, [token]);

  // Fetch Problems from API
  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/problems`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok)
        throw new Error(
          `Error: ${res.statusText}, please sign in or create an account!`
        );

      const data: Problem[] = await res.json();

      const validProblems = Array.isArray(data) ? data : [];
      setProblems(validProblems);
      setFilteredProblems(validProblems);

      // Extract unique tags
      const tagSet = new Set<string>();
      validProblems.forEach((problem) =>
        problem.tags?.forEach((tag) => tagSet.add(tag))
      );
      setAvailableTags([...tagSet]);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();

    const filtered = problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(lowerSearch) ||
        p.lcnumber.toLowerCase().includes(lowerSearch);

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => p.tags?.includes(tag));

      const matchesDifficulty =
        selectedDifficulties.length === 0 ||
        selectedDifficulties.includes(p.difficulty);

      return matchesSearch && matchesTags && matchesDifficulty;
    });

    setFilteredProblems(filtered);
  }, [searchTerm, selectedTags, selectedDifficulties, problems]);

  useEffect(() => {
    fetchProblems();
  }, []);

  // Submit new/edit problem
  const handleSubmit = async (
    data: Omit<Problem, "id" | "created_time" | "updated_time" | "user_id">,
    id?: string
  ) => {
    try {
      const method = id ? "PATCH" : "POST";
      const url = id ? `${API_BASE}/problems/${id}` : `${API_BASE}/problems`;
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok)
        throw new Error("Please sign in or create an account first!");
      setShowForm(false);
      setEditing(null);
      fetchProblems();
    } catch (err: any) {
      alert(err.message || "Unknown error occurred");
    }
  };

  // Delete problem
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/problems/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchProblems();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  // Stats calculations
  const totalSolved = problems.filter(
    (problem) => problem.completed === true
  ).length;

  const difficultyCount = useMemo(() => {
    const counts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach((p) => {
      if (p.difficulty && counts[p.difficulty] !== undefined) {
        counts[p.difficulty]++;
      }
    });
    return counts;
  }, [problems]);

  const mostUsedTags = useMemo(() => {
    const tagFrequency: Record<string, number> = {};
    problems.forEach((p) => {
      p.tags?.forEach((tag) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });
    // Sort tags by frequency desc
    return Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [problems]);

  return (
    <Stack spacing={6}>
      <Navbar />
      <Container maxW="container.md" py={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <HStack spacing={2} mt={4}>
            <Button
              colorScheme="teal"
              onClick={() => {
                setShowForm(true);
                setEditing(null);
              }}
            >
              Add New Problem
            </Button>
            <Button
              leftIcon={<FaChartBar />}
              colorScheme="blue"
              onClick={onStatsOpen}
            >
              Stats Dashboard
            </Button>
          </HStack>
        </Flex>

        {/* Stats Drawer */}
        <Drawer isOpen={isStatsOpen} placement="right" onClose={onStatsClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Stats Dashboard</DrawerHeader>
            <DrawerBody>
              <Box mb={6}>
                <Heading size="md" mb={2}>
                  Problems Solved
                </Heading>
                <Text fontSize="2xl" fontWeight="bold">
                  {totalSolved}
                </Text>
              </Box>

              <Box mb={6}>
                <Heading size="md" mb={2}>
                  Activity Map
                </Heading>
                <ActivityMap problems={problems}/>
              </Box>

              <Box mb={6}>
                <Heading size="md" mb={2}>
                  Difficulty Breakdown
                </Heading>
                <Stack spacing={1}>
                  {DIFFICULTIES.map((diff) => (
                    <Text key={diff}>
                      {diff}: {difficultyCount[diff] || 0}
                    </Text>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Heading size="md" mb={2}>
                  Most Used Tags
                </Heading>
                <Wrap>
                  {mostUsedTags.length === 0 && <Text>No tags available</Text>}
                  {mostUsedTags.map(([tag, count]) => (
                    <Tag key={tag} size="md" colorScheme="teal" m={1}>
                      <TagLabel>{tag}</TagLabel>
                      <TagRightIcon />
                      <Text ml={1} fontSize="sm">
                        ({count})
                      </Text>
                    </Tag>
                  ))}
                </Wrap>
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {showForm && (
          <Box mt={4}>
            <ProblemForm
              onSubmit={handleSubmit}
              initialData={editing || undefined}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </Box>
        )}

        {!showForm && (
          <>
            <InputGroup mt={4}>
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search by title or LC number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Box
              mt={4}
              _hover={{ bg: "gray.100", borderRadius: "md" }}
              px={2}
              py={1}
              cursor="pointer"
              onClick={toggleTags}
            >
              <Stack direction="row" align="center">
                <Heading size="sm" mb={0}>
                  Filter by Tags
                </Heading>
                <IconButton
                  size="sm"
                  icon={isTagsOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  aria-label="Toggle Tags Filter"
                  variant="ghost"
                />
              </Stack>
            </Box>

            <Collapse in={isTagsOpen} animateOpacity>
              <CheckboxGroup
                colorScheme="teal"
                value={selectedTags}
                onChange={(vals) => setSelectedTags(vals as string[])}
              >
                <Wrap mt={2}>
                  {availableTags.map((tag) => (
                    <WrapItem key={tag}>
                      <Checkbox value={tag}>{tag}</Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
            </Collapse>

            <Box
              mt={4}
              _hover={{ bg: "gray.100", borderRadius: "md" }}
              px={2}
              py={1}
              cursor="pointer"
              onClick={toggleDifficulties}
            >
              <Stack direction="row" align="center">
                <Heading size="sm" mb={0}>
                  Filter by Difficulty
                </Heading>
                <IconButton
                  size="sm"
                  icon={
                    isDifficultiesOpen ? (
                      <ChevronDownIcon />
                    ) : (
                      <ChevronRightIcon />
                    )
                  }
                  aria-label="Toggle Difficulty Filter"
                  variant="ghost"
                />
              </Stack>
            </Box>

            <Collapse in={isDifficultiesOpen} animateOpacity>
              <CheckboxGroup
                colorScheme="orange"
                value={selectedDifficulties}
                onChange={(vals) => setSelectedDifficulties(vals as string[])}
              >
                <Stack direction="row" mt={2}>
                  {DIFFICULTIES.map((d) => (
                    <Checkbox key={d} value={d}>
                      {d}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Collapse>

            {(!!searchTerm ||
              selectedTags.length > 0 ||
              selectedDifficulties.length > 0) && (
              <Button
                mt={3}
                size="sm"
                variant="outline"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            )}
          </>
        )}

        <Divider my={6} />

        {loading && (
          <Stack align="center" py={10}>
            <Spinner size="xl" />
          </Stack>
        )}

        {error && (
          <Text color="red.500" mt={4}>
            {error}
          </Text>
        )}

        {!loading && !error && !showForm && (
          <Stack spacing={4} mt={4}>
            {filteredProblems.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                onEdit={(p) => {
                  setEditing(p);
                  setShowForm(true);
                }}
                onDelete={() => handleDelete(problem.id)}
              />
            ))}
            {filteredProblems.length === 0 && (
              <Text textAlign="center" color="gray.500" mt={6}>
                No problems found.
              </Text>
            )}
          </Stack>
        )}

        <Button
          mt={8}
          colorScheme="green"
          onClick={() => exportToCSV(problems)}
          isDisabled={problems.length === 0}
        >
          Export All Problems to CSV
        </Button>
      </Container>
    </Stack>
  );
}
