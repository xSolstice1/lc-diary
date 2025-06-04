import { Button, Stack } from "@chakra-ui/react";
import Home from "./pages";
import Footer from "./components/Footer";

function App() {
  return (
    <Stack minH='100vh'>
      <Home />
      <Footer />
    </Stack>
  );
}

export default App;
