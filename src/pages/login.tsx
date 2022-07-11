import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import toast from "react-hot-toast";

function Login() {
  const { mutateAsync } = trpc.useMutation(["login"], { ssr: false });
  const router = useRouter();
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const promise = mutateAsync({ password }).then((data) => {
          if (data) {
            router.push("/");
          }
        });
        toast.promise(
          promise,
          {
            loading: "Logging in...",
            success: "Logged in!",
            error: "Login failed!",
          },
          { id: "login" }
        );
      }}
    >
      <Flex
        minH={"100vh"}
        align={"center"}
        justify={"center"}
        bg={useColorModeValue("gray.50", "gray.800")}
      >
        <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
          <Stack align={"center"}>
            <Heading fontSize={"4xl"}>Sign in</Heading>
          </Stack>
          <Box
            rounded={"lg"}
            bg={useColorModeValue("white", "gray.700")}
            boxShadow={"lg"}
            p={8}
          >
            <Stack spacing={4}>
              <FormControl id="password">
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </FormControl>
              <Stack spacing={10}>
                <Button colorScheme={"facebook"} type="submit">
                  Sign in
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Flex>
    </form>
  );
}

export default Login;
