import { useEffect, useState, useContext } from "react";
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
} from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import Navbar from "../components/Navbar";
import ProblemCard from "../components/ProblemCard";
import ProblemForm from "../components/ProblemForm";
import type { Problem } from "../types/Problems";
import { AuthContext } from "../auth/AuthContext";
import { exportToCSV } from "../utils/ExportToCSV";

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
      if (!res.ok) throw new Error(`Delete failed`);
      fetchProblems();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  return (
    <Stack spacing={6}>
      <Navbar />
      <Container maxW="container.md" py={6}>
        <Button
          colorScheme="teal"
          onClick={() => {
            setShowForm(true);
            setEditing(null);
          }}
        >
          Add New Problem
        </Button>

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

            <Box mt={4}>
              <Heading size="sm" mb={2}>
                Filter by Tags
              </Heading>
              <CheckboxGroup
                colorScheme="teal"
                value={selectedTags}
                onChange={(vals) => setSelectedTags(vals as string[])}
              >
                <Wrap>
                  {availableTags.map((tag) => (
                    <WrapItem key={tag}>
                      <Checkbox value={tag}>{tag}</Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
            </Box>

            <Box mt={4}>
              <Heading size="sm" mb={2}>
                Filter by Difficulty
              </Heading>
              <CheckboxGroup
                colorScheme="orange"
                value={selectedDifficulties}
                onChange={(vals) => setSelectedDifficulties(vals as string[])}
              >
                <Stack direction="row">
                  {DIFFICULTIES.map((d) => (
                    <Checkbox key={d} value={d}>
                      {d}
                    </Checkbox>
                  ))}
                </Stack>
              </CheckboxGroup>
            </Box>

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
                onDelete={handleDelete}
              />
            ))}
            {filteredProblems.length === 0 && (
              <Text>No problems match the selected filters.</Text>
            )}
            <Button
              mt={3}
              size="sm"
              colorScheme="blue"
              onClick={() => {
                const filteredData = filteredProblems.map(
                  ({ id,user_id, ...rest }) => rest
                );
                exportToCSV(filteredData, "problems.csv");
              }}
            >
              Export to CSV
            </Button>
          </Stack>
        )}
      </Container>
    </Stack>
  );
}
