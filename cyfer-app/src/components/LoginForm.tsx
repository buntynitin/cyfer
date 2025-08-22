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
import { LockIcon } from "@chakra-ui/icons";
import { useAppToast } from "../ui/toast";

interface Props {
  onLogin: (password: string) => void;
  error?: string;
}

export default function LoginForm({ onLogin, error }: Props) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useAppToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({ title: "Password required", status: "warning", duration: 2000 });
      return;
    }
    try {
      setIsSubmitting(true);
      await Promise.resolve();
      onLogin(password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Center h="100vh">
      <Container maxW="sm">
        <Stack spacing={6} as="form" onSubmit={handleSubmit} align="center">
          <VStack spacing={1}>
            <Heading size="md">Unlock Cyfer Vault</Heading>
            <Text color="gray.500">Enter your master password to continue</Text>
          </VStack>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <FormControl>
            <FormLabel srOnly>Master Password</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <LockIcon color="gray.400" />
              </InputLeftElement>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master Password"
                autoFocus
              />
            </InputGroup>
          </FormControl>

          <Button type="submit" colorScheme="gray" size="sm" isLoading={isSubmitting} loadingText="Unlocking">
            Unlock
          </Button>
        </Stack>
      </Container>
    </Center>
  );
}
