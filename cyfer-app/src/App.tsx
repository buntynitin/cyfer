import { useMemo, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import LoginForm from "./components/LoginForm";
import GetStartedScreen from "./components/GetStartedScreen";
import VaultList from "./components/VaultList";
import SecretForm from "./components/SecretForm";
import { SecretBundle } from "./types";
import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  Badge,
  Flex,
  Input,
  IconButton,
  HStack,
  Tooltip,
  Spacer,
  Center,
} from "@chakra-ui/react";
import { CopyIcon, ViewOffIcon, ViewIcon, SearchIcon, LockIcon } from "@chakra-ui/icons";
import { useAppToast } from "./ui/toast";

export default function App() {
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSecret, setSelectedSecret] = useState<SecretBundle | null>(null);
  const [revealSecret, setRevealSecret] = useState(false);
  const [loginError, setLoginError] = useState<string>("");
  const toast = useAppToast();

  // Check if vault exists on app start
  useEffect(() => {
    const checkVault = async () => {
      try {
        const exists = await invoke<boolean>("check_if_vault_exists");
        setVaultExists(exists);
      } catch (e) {
        console.error("Failed to check vault existence:", e);
        setVaultExists(false);
      }
    };
    checkVault();
  }, []);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.toLowerCase().includes(q));
  }, [services, search]);

  const loadServices = async (password: string) => {
    try {
      const result = await invoke<string[]>("list_services", { masterPassword: password });
      setServices(result);
    } catch (e) {
      toast({ title: "Failed to load vault", status: "error" });
    }
  };

  const handleCreateVault = async (password: string) => {
    try {
      await invoke("create_vault", { masterPassword: password });
      setVaultExists(true);
      setMasterPassword(password);
      loadServices(password);
      toast({ title: "Vault created successfully", status: "success" });
    } catch (e) {
      toast({ title: "Failed to create vault", status: "error" });
    }
  };

  const handleLogin = async (password: string) => {
    try {
      setLoginError("");
      const isValid = await invoke<boolean>("is_correct_password", { masterPassword: password });
      if (isValid) {
        setMasterPassword(password);
        setLoginError("");
        loadServices(password);
      } else {
        setLoginError("Incorrect password");
      }
    } catch (e) {
      setLoginError("Failed to verify password");
    }
  };

  const handleSelectService = async (service: string) => {
    if (!masterPassword) return;
    try {
      const secret = await invoke<SecretBundle>("get_service", {
        masterPassword,
        service,
      });
      setSelectedService(service);
      setSelectedSecret(secret);
      setRevealSecret(false);
    } catch (e) {
      toast({ title: "Failed to load item", status: "error" });
    }
  };

  const handleDeleteService = async (service: string) => {
    if (!masterPassword) return;
    try {
      await invoke("delete_service", { masterPassword, service });
      setServices((prev) => prev.filter((s) => s !== service));
      if (selectedService === service) setSelectedSecret(null);
      toast({ title: "Deleted", status: "success" });
    } catch (e) {
      toast({ title: "Delete failed", status: "error" });
    }
  };

  const handleAddService = async (service: string, username: string, secret: string, notes?: string) => {
    if (!masterPassword) return;
    try {
      const secretBundle: SecretBundle = { username, secret, notes };
      await invoke("add_service", { masterPassword, service, secretBundle });
      
      // Refresh the services list
      await loadServices(masterPassword);
      
      // Clear selected items
      setSelectedService(null);
      setSelectedSecret(null);
      setRevealSecret(false);
      
      toast({ title: "Saved", status: "success" });
    } catch (e) {
      toast({ title: "Save failed", status: "error" });
    }
  };

  const handleLock = () => {
    setMasterPassword(null);
    setServices([]);
    setSearch("");
    setSelectedService(null);
    setSelectedSecret(null);
    setRevealSecret(false);
    setLoginError("");
    toast({ title: "Locked", status: "success" });
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied`, status: "success" });
    } catch {
      toast({ title: `Failed to copy ${label.toLowerCase()}`, status: "error" });
    }
  };

  // Show loading state while checking vault existence
  if (vaultExists === null) {
    return (
      <Center h="100vh">
        <Text>Loading...</Text>
      </Center>
    );
  }

  // Show get started screen if vault doesn't exist
  if (!vaultExists) {
    return <GetStartedScreen onCreateVault={handleCreateVault} />;
  }

  // Show login form if vault exists but not unlocked
  if (!masterPassword) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  return (
    <Container maxW="6xl" py={3}>
      <HStack mb={3}>
        <Heading size="sm" fontWeight="semibold">Passwords</Heading>
        <Spacer />
        <HStack>
          <IconButton aria-label="Lock" icon={<LockIcon />} size="sm" variant="ghost" onClick={handleLock} />
          <SecretForm onSubmit={handleAddService} />
        </HStack>
      </HStack>

      <Flex gap={3} align="stretch" h="calc(100vh - 120px)">
        <Box flex="0 0 320px" borderWidth="1px" borderRadius="md" p={2} display="flex" flexDirection="column">
          <HStack mb={2}>
            <Input size="sm" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} pl={8} />
            <Box position="relative" right="calc(100% - 28px)" pointerEvents="none">
              <SearchIcon color="gray.400" />
            </Box>
          </HStack>
          <Box overflowY="auto" flex="1">
            <VaultList
              services={filteredServices}
              onSelect={handleSelectService}
              onDelete={handleDeleteService}
              selectedService={selectedService}
            />
          </Box>
        </Box>

        <Box flex="1" borderWidth="1px" borderRadius="md" p={4} display="flex" flexDirection="column" justifyContent="center">
          {selectedSecret ? (
            <Box>
              <Heading size="sm" mb={2} fontWeight="semibold" textAlign="center">{selectedService}</Heading>
              <Stack spacing={3} maxW="lg" mx="auto">
                <HStack>
                  <Text w="96px"><Badge colorScheme="gray">Username</Badge></Text>
                  <Text flex="1">{selectedSecret.username}</Text>
                  <Tooltip label="Copy username">
                    <IconButton aria-label="Copy username" icon={<CopyIcon />} size="sm" variant="ghost" onClick={() => copyToClipboard(selectedSecret.username, "Username")} />
                  </Tooltip>
                </HStack>
                <HStack>
                  <Text w="96px"><Badge colorScheme="gray">Secret</Badge></Text>
                  <Text flex="1">{revealSecret ? selectedSecret.secret : "••••••••••"}</Text>
                  <Tooltip label={revealSecret ? "Hide" : "Reveal"}>
                    <IconButton aria-label="Toggle reveal" icon={revealSecret ? <ViewOffIcon /> : <ViewIcon />} size="sm" variant="ghost" onClick={() => setRevealSecret((v) => !v)} />
                  </Tooltip>
                  <Tooltip label="Copy secret">
                    <IconButton aria-label="Copy secret" icon={<CopyIcon />} size="sm" variant="ghost" onClick={() => copyToClipboard(selectedSecret.secret, "Secret")} />
                  </Tooltip>
                </HStack>
                {selectedSecret.notes && (
                  <HStack>
                    <Text w="96px"><Badge colorScheme="gray">Notes</Badge></Text>
                    <Text flex="1">{selectedSecret.notes}</Text>
                  </HStack>
                )}
              </Stack>
            </Box>
          ) : (
            <Text color="gray.500" textAlign="center">Select an item from the sidebar</Text>
          )}
        </Box>
      </Flex>
    </Container>
  );
}
