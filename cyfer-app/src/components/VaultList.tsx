import {
  Box,
  Heading,
  List,
  ListItem,
  HStack,
  Text,
  Button,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { DeleteIcon, ViewIcon } from "@chakra-ui/icons";
import { useRef, useState } from "react";

interface Props {
  services: string[];
  onSelect: (service: string) => void;
  onDelete: (service: string) => void;
  selectedService?: string | null;
}

export default function VaultList({ services, onSelect, onDelete, selectedService }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const confirmDelete = (service: string) => {
    setPendingDelete(service);
    onOpen();
  };

  const handleConfirm = () => {
    if (pendingDelete) {
      onDelete(pendingDelete);
      setPendingDelete(null);
    }
    onClose();
  };

  return (
    <Box>
      <Heading size="sm" mb={2} fontWeight="semibold">Items</Heading>
      {services.length === 0 ? (
        <Text color="gray.500">(empty)</Text>
      ) : (
        <List>
          {services.map((s) => {
            const isActive = selectedService === s;
            return (
              <ListItem
                key={s}
                borderRadius="md"
                bg={isActive ? "blackAlpha.100" : undefined}
                _hover={{ bg: isActive ? "blackAlpha.100" : undefined }}
                px={2}
                py={1}
              >
                <HStack justify="space-between">
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={() => onSelect(s)}
                    px={2}
                    py={1}
                    w="full"
                    fontWeight={isActive ? "semibold" : "normal"}
                    leftIcon={<ViewIcon />}
                    _hover={{ bg: "transparent" }}
                    _active={{ bg: "transparent" }}
                    _focus={{ boxShadow: "none" }}
                  >
                    {s}
                  </Button>
                  <IconButton
                    aria-label="Delete"
                    icon={<DeleteIcon />}
                    onClick={() => confirmDelete(s)}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    _hover={{ bg: "transparent" }}
                    _active={{ bg: "transparent" }}
                    _focus={{ boxShadow: "none" }}
                  />
                </HStack>
              </ListItem>
            );
          })}
        </List>
      )}

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered size="sm">
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="md" fontWeight="semibold">Delete “{pendingDelete}”?</AlertDialogHeader>
            <AlertDialogBody>
              This item will be removed from your vault. You can’t undo this action.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">Cancel</Button>
              <Button colorScheme="red" onClick={handleConfirm} ml={3}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
