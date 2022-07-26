import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  Link as ChakraLink,
  ListItem,
  Progress,
  Spinner,
  UnorderedList,
} from "@chakra-ui/react";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import Error from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "~/utils/api/uploadFile";
import { trpc } from "~/utils/trpc";

function AppPage() {
  const router = useRouter();
  const slug = router.query.slug as string[];
  const appName = slug[0]!;
  const paths = slug.length > 1 ? slug.slice(1) : [];
  const query = trpc.useQuery(["drive.app.files", { name: appName, paths }]);
  const deleteApp = trpc.useMutation("drive.deleteApp", {
    onSuccess: () => {
      router.push("/");
    },
  });
  const createFolder = trpc.useMutation("drive.createFolder", {
    onSuccess: () => {
      query.refetch();
    },
  });
  const deleteFolder = trpc.useMutation("drive.deleteFolder", {
    onSuccess: () => {
      query.refetch();
    },
  });
  const deleteFile = trpc.useMutation("drive.deleteFile", {
    onSuccess: () => {
      query.refetch();
    },
  });

  const [progress, setProgress] = useState<number>();
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const fileRef = useRef<HTMLInputElement>(null);
  const data = query.data;
  const path = paths.length > 0 ? paths.join("/") + "/" : "";

  if (query.error?.data?.httpStatus === 404)
    return <Error statusCode={404}></Error>;
  if (!data) return <Spinner />;
  const { app, folders, files } = data;
  return (
    <Container marginBlock={8}>
      <Link href="/" passHref>
        <Button as="a" leftIcon={<ArrowBackIcon />} variant="ghost">
          Back
        </Button>
      </Link>
      <Breadcrumb>
        {slug.map((name, index) => (
          <BreadcrumbItem key={index} isCurrentPage={index === slug.length - 1}>
            <Link
              href={{
                pathname: "/app/[...slug]",
                query: { slug: slug.slice(0, index + 1) },
              }}
            >
              <BreadcrumbLink>{name}</BreadcrumbLink>
            </Link>
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
      <Flex alignItems={"center"} gap={4}>
        <Heading className="my-0">{app.name}</Heading>
        <Button
          size={"sm"}
          colorScheme={"red"}
          onClick={() => {
            const name = prompt(
              `Are you sure? Input "${appName}" to confirm delete.`
            );

            if (name === appName) {
              deleteApp.mutate(name);
            }
          }}
        >
          Delete App
        </Button>
        <Link href={`/keys/${appName}`} passHref>
          <Button as="a" colorScheme={"purple"}>
            API keys
          </Button>
        </Link>
      </Flex>
      <UnorderedList ref={parent}>
        {folders.map((folder) => (
          <ListItem key={folder} marginBlock={2}>
            <Link
              href={{
                pathname: "/app/[...slug]",
                query: { slug: [...slug, folder.slice(0, -1)] },
              }}
            >
              <ChakraLink>{folder}</ChakraLink>
            </Link>
            <Button
              colorScheme={"red"}
              size={"sm"}
              marginInline={4}
              onClick={() => {
                if (confirm("Are you sure?")) {
                  const promise = deleteFolder.mutateAsync({
                    appName,
                    name: folder.slice(0, -1),
                    path,
                  });

                  toast.promise(
                    promise,
                    {
                      loading: `Deleting ${folder}...`,
                      success: (count) =>
                        `Deleted ${folder} (${count} objects)`,
                      error: `Failed to delete ${folder}`,
                    },
                    { id: "delete-folder" }
                  );
                }
              }}
            >
              Delete
            </Button>
          </ListItem>
        ))}
        {files.map((file) => (
          <li key={file.name}>
            <ChakraLink href={file.link} target="_blank" rel="noreferrer">
              {file.name}
            </ChakraLink>
            <Button
              colorScheme={"red"}
              size={"sm"}
              marginInline={4}
              onClick={() => {
                if (confirm("Are you sure?")) {
                  deleteFile.mutate({ appName, path, name: file.name });
                }
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </UnorderedList>
      <Button
        colorScheme={"blue"}
        onClick={() => {
          const name = prompt("Input folder name");
          if (name) {
            createFolder.mutate({
              appName,
              name,
              path,
            });
          }
        }}
      >
        Create folder
      </Button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fileList = fileRef.current!.files;
          if (!fileList) return;
          const file = fileList[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("file", file);
          formData.append("appName", appName);
          formData.append("path", path);
          uploadFile(formData, (p) => {
            setProgress((p.loaded / p.total) * 100);
          }).then((res) => {
            setProgress(undefined);
            fileRef.current!.value = "";
            query.refetch();
          });
        }}
      >
        <input type="file" ref={fileRef} />
        <Button type="submit">Upload</Button>
      </form>
      {progress !== undefined && <Progress value={progress} />}
    </Container>
  );
}

export default AppPage;
