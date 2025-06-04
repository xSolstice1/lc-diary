import {
  Box,
  Flex,
  Heading,
  IconButton,
  useColorMode,
  useColorModeValue,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FaMoon, FaSun } from "react-icons/fa";
import Signup from "../pages/signup";
import Login from "../pages/login";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("teal.500", "teal.700");
  const color = useColorModeValue("white", "gray.200");

  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  const {
    isOpen: isSignupOpen,
    onOpen: onSignupOpen,
    onClose: onSignupClose,
  } = useDisclosure();

  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({
      title: "Logged out.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box bg={bg} px={6} py={4} color={color} width="100vw" position="sticky" top={0} zIndex={10}>
      <Flex align="center" justify="space-between">
        <Heading size="md">LeetCode Diary</Heading>
        <Flex gap={2} align="center">
          {!token ? (
            <>
              <Button colorScheme="teal" onClick={onLoginOpen}>
                Login
              </Button>
              <Button colorScheme="teal" onClick={onSignupOpen}>
                Signup
              </Button>
            </>
          ) : (
            <Button colorScheme="red" onClick={handleLogout}>
              Logout
            </Button>
          )}
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            variant="ghost"
            color={color}
          />
        </Flex>
      </Flex>

      {/* Login Modal */}
      <Modal isOpen={isLoginOpen} onClose={onLoginClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Login onClose={onLoginClose} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Signup Modal */}
      <Modal isOpen={isSignupOpen} onClose={onSignupClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Signup</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Signup onClose={onSignupClose} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
