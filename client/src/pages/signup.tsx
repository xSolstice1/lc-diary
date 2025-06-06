import { useState } from "react";
import {
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

type SignupProps = {
  onClose?: () => void;
};

export default function Signup({ onClose }: SignupProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateInputs = (): string | null => {
    const usernameRegex = /^[a-zA-Z0-9]{8,}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

    if (!usernameRegex.test(username)) {
      return "Username must be at least 8 characters long and contain only letters and numbers.";
    }

    if (!passwordRegex.test(password)) {
      return "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
    }

    return null;
  };

  const handleSignup = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Signup failed, user already exists!");

      setSuccess("Signup successful! You can now log in. Closing in 3 seconds...");

      if (onClose) {
        setTimeout(() => onClose(), 1500);
      } else {
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    }
  };

  return (
    <Container centerContent py={10}>
      <Heading mb={6}>Sign Up</Heading>
      <Stack spacing={4} w="full" maxW="md">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Text fontSize="sm" color="gray.500">
          • At least 8 characters, only letters and numbers (no special characters)
        </Text>

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Text fontSize="sm" color="gray.500">
          • At least 8 characters, must include:
          uppercase, lowercase, number, and special character
        </Text>

        <Button colorScheme="blue" onClick={handleSignup}>
          Sign Up
        </Button>

        {error && <Text color="red.500">{error}</Text>}
        {success && <Text color="green.500">{success}</Text>}
      </Stack>
    </Container>
  );
}
