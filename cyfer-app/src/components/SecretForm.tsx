import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";

interface Props {
  onSubmit: (service: string, username: string, secret: string, notes?: string) => void;
}

export default function SecretForm({ onSubmit }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setService("");
    setUsername("");
    setSecret("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service.trim()) {
      return;
    }
    
    if (!username.trim()) {
      return;
    }
    
    if (!secret.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      onSubmit(service.trim(), username.trim(), secret, notes?.trim() || undefined);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button colorScheme="gray" leftIcon={undefined} onClick={onOpen} size="sm">Add Password</Button>

      <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} size="md">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>Add New Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Service</FormLabel>
                <Input value={service} onChange={(e) => setService(e.target.value)} placeholder="GitHub, Google, Bank..." />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user@example.com" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Secret</FormLabel>
                <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="••••••••" />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button colorScheme="gray" type="submit" isLoading={isSubmitting}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
