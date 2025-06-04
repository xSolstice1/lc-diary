import { useEffect, useState } from "react";
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
} from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import Navbar from "../components/Navbar";
import ProblemCard from "../components/ProblemCard";
import ProblemForm from "../components/ProblemForm";
import type { Problem } from "../types/Problems";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function Home() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [editing, setEditing] = useState<Problem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/problems`);
      if (!res.ok)
        throw new Error(`Error fetching problems: ${res.statusText}`);
      const data = await res.json();
      setProblems(Array.isArray(data) ? data : []);
      setFilteredProblems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProblems(problems);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    setFilteredProblems(
      problems.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerSearch) ||
          p.lcnumber.toLowerCase().includes(lowerSearch)
      )
    );
  }, [searchTerm, problems]);

  const handleSubmit = async (
    data: Omit<Problem, "id" | "created_time" | "updated_time">,
    id?: string
  ) => {
    try {
      const method = id ? "PATCH" : "POST";
      const url = id ? `${API_BASE}/problems/${id}` : `${API_BASE}/problems`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok)
        throw new Error(
          `Failed to ${id ? "update" : "create"} problem: ${res.statusText}`
        );
      setShowForm(false);
      setEditing(null);
      fetchProblems();
    } catch (err: any) {
      alert(err.message || "Unknown error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/problems/${id}`, {
        method: "DELETE",
      });
      if (!res.ok)
        throw new Error(`Failed to delete problem: ${res.statusText}`);
      fetchProblems();
    } catch (err: any) {
      alert(err.message || "Unknown error occurred");
    }
  };

  return (
    <Stack>
      <Navbar />
      <Container>
        <Button
          mb={4}
          colorScheme="teal"
          onClick={() => {
            setShowForm(true);
            setEditing(null);
          }}
        >
          Add New Problem
        </Button>

        {showForm && (
          <Box mb={6}>
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
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none" children={<FaSearch color="gray.300" />} />
            <Input
              placeholder="Search by title or LeetCode number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        )}

        {loading && (
          <Stack align="center" py={10}>
            <Spinner size="xl" />
          </Stack>
        )}

        {error && (
          <Text color="red.500" mb={4}>
            {error}
          </Text>
        )}

        {!loading && !error && !showForm && (
          <Stack spacing={4}>
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
          </Stack>
        )}
      </Container>
    </Stack>
  );
}
