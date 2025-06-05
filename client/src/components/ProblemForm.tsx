import { useState, useEffect } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Select,
  Checkbox,
} from "@chakra-ui/react";
import type { Problem } from "../types/Problems";

interface Props {
  onSubmit: (
    data: Omit<Problem, "id" | "created_time" | "updated_time" | "user_id">,
    id?: string
  ) => void;
  initialData?: Problem;
  onCancel: () => void;
}

export default function ProblemForm({
  onSubmit,
  initialData,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState({
    lcnumber: "",
    title: "",
    tags: "",
    difficulty: "Easy",
    solution: "",
    notes: "",
    completed: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        lcnumber: initialData.lcnumber,
        title: initialData.title,
        tags: initialData.tags.join(", "),
        difficulty: initialData.difficulty,
        solution: initialData.solution,
        notes: initialData.notes,
        completed: initialData.completed,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  if (name === "completed") {
    const target = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, completed: target.checked }));
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const dataToSubmit = {
      lcnumber: formData.lcnumber.trim(),
      title: formData.title.trim(),
      tags: tagsArray,
      difficulty: formData.difficulty,
      solution: formData.solution.trim(),
      notes: formData.notes.trim(),
      completed: formData.completed,
    };

    onSubmit(dataToSubmit, initialData?.id);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <FormControl>
          <FormLabel>Title</FormLabel>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </FormControl>

        <FormControl>
          <FormLabel>LeetCode Number</FormLabel>
          <Input
            name="lcnumber"
            value={formData.lcnumber}
            onChange={handleChange}
            required
          />
        </FormControl>

        <FormControl>
          <FormLabel>Tags (comma-separated)</FormLabel>
          <Input name="tags" value={formData.tags} onChange={handleChange} />
        </FormControl>

        <FormControl>
          <FormLabel>Difficulty</FormLabel>
          <Select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Solution</FormLabel>
          <Textarea
            name="solution"
            value={formData.solution}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <Checkbox
            name="completed"
            isChecked={formData.completed}
            onChange={handleChange}
          >
            Completed
          </Checkbox>
        </FormControl>

        <Stack direction="row" justify="flex-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button colorScheme="teal" type="submit">
            {initialData ? "Update" : "Create"}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
