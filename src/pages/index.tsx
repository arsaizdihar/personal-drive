import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link as ChakraLink,
  ListItem,
  UnorderedList,
} from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import type { NextPage } from "next";
import Link from "next/link";
import { useRef } from "react";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data } = trpc.useQuery(["drive.appList"]);
  const utils = trpc.useContext();
  const createApp = trpc.useMutation("drive.createApp", {
    onSuccess: () => {
      utils.invalidateQueries(["drive.appList"]);
    },
  });
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Container marginBlock={8}>
      <Heading>App list</Heading>
      <UnorderedList ref={parent}>
        {data?.map((app) => (
          <ListItem key={app.id} marginBlock={2}>
            <Link
              href={{
                pathname: "/app/[appName]",
                query: { appName: app.name },
              }}
            >
              <ChakraLink>{app.name}</ChakraLink>
            </Link>
          </ListItem>
        ))}
      </UnorderedList>
      <form
        className="flex gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const appName = ref.current!.value;

          if (appName.length > 0) {
            createApp.mutate(appName, {
              onSuccess: () => {
                console.log("success");
                ref.current!.value = "";
                ref.current?.focus();
              },
            });
          }
        }}
      >
        <FormControl>
          <FormLabel htmlFor="appName">App Name</FormLabel>
          <Input
            type="text"
            placeholder="App name"
            name="appName"
            ref={ref}
            colorScheme="blue"
            variant="filled"
          />
        </FormControl>
        <Button
          disabled={createApp.isLoading}
          variant="solid"
          colorScheme={"blue"}
          type="submit"
        >
          Create app
        </Button>
      </form>
    </Container>
  );
};

export default Home;
