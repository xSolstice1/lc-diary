import { useState } from "react";
import { Button, Container, Heading, Input, Stack, Text } from "@chakra-ui/react";
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

  const handleSignup = async () => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Signup failed");

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
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button colorScheme="blue" onClick={handleSignup}>Sign Up</Button>
        {error && <Text color="red.500">{error}</Text>}
        {success && <Text color="green.500">{success}</Text>}
      </Stack>
    </Container>
  );
}
