import { Button, Stack } from "@chakra-ui/react";
import Home from "./pages";
import Signup from "./pages/signup";
import Login from "./pages/login";

function App() {
  return (
    <Stack minH='100vh'>
      <Home />
    </Stack>
  );
}

export default App;
