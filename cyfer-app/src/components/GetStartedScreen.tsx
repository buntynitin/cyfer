import { useState } from "react";
import {
  Button,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  FormControl,
  FormLabel,
  Container,
  Text,
  VStack,
  Center,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { LockIcon, StarIcon } from "@chakra-ui/icons";

interface Props {
  onCreateVault: (password: string) => void;
}

export default function GetStartedScreen({ onCreateVault }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsSubmitting(true);
      onCreateVault(password);
    } catch (err) {
      setError("Failed to create vault");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Center h="100vh">
      <Container maxW="sm">
        <Stack spacing={6} as="form" onSubmit={handleSubmit} align="center">
          <VStack spacing={1}>
            <StarIcon boxSize={12} color="blue.500" />
            <Heading size="lg">Welcome to Cyfer</Heading>
            <Text color="gray.500" textAlign="center">
              Create your secure password vault to get started
            </Text>
          </VStack>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl>
            <FormLabel>Master Password</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <LockIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
                autoFocus
              />
            </InputGroup>
          </FormControl>

          <FormControl>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <LockIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm master password"
              />
            </InputGroup>
          </FormControl>

          <Button 
            type="submit" 
            colorScheme="blue" 
            size="lg" 
            isLoading={isSubmitting} 
            loadingText="Creating Vault"
            w="full"
          >
            Create Vault
          </Button>
        </Stack>
      </Container>
    </Center>
  );
} 