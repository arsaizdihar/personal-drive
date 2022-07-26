import { ArrowBackIcon } from "@chakra-ui/icons";
import { Button, Container, Spinner } from "@chakra-ui/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Error from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { trpc } from "~/utils/trpc";

function AppPage() {
  const router = useRouter();
  const appName = router.query.appName as string;
  const query = trpc.useQuery(["drive.app.apiKeys", appName]);
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const utils = trpc.useContext();
  const { mutateAsync } = trpc.useMutation("drive.createApiKey", {
    onSuccess: (res) => {
      utils.setQueryData(["drive.app.apiKeys", appName], (data) => {
        if (!data) {
          return data as any;
        }
        return { ...data, apiKeys: [...data.apiKeys, res] };
      });
    },
  });
  const apiKeyDelete = trpc.useMutation("drive.deleteApiKey", {
    onSuccess(data, variables, context) {
      utils.setQueryData(["drive.app.apiKeys", appName], (data) => {
        if (!data) {
          return data as any;
        }
        return {
          ...data,
          apiKeys: data.apiKeys.filter(({ id }) => id !== variables.id),
        };
      });
    },
  });

  if (query.error) return <Error statusCode={404}></Error>;
  if (!query.data) return null;
  const app = query.data;
  return (
    <Container marginBlock={8}>
      <Link href={`/app/${appName}`} passHref>
        <Button as="a" leftIcon={<ArrowBackIcon />} variant="ghost">
          Back
        </Button>
      </Link>
      <h1 className="my-0">{app.name}</h1>
      <ul ref={parent}>
        {app.apiKeys.map((apiKey) => {
          const isLoading =
            apiKeyDelete.isLoading && apiKeyDelete.variables?.id === apiKey.id;
          return (
            <li key={apiKey.id}>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey.key);
                    toast.success("Copied to clipboard", {
                      id: "api-key-copied",
                    });
                  }}
                  className="my-0 hover:underline"
                >
                  {apiKey.key}
                </button>
                <Button
                  variant="danger"
                  className="my-0 ml-4"
                  disabled={isLoading}
                  onClick={() => {
                    if (confirm("Are you sure?")) {
                      apiKeyDelete.mutate({ id: apiKey.id, appName });
                    }
                  }}
                >
                  Delete
                </Button>
                {isLoading && <Spinner />}
              </div>
            </li>
          );
        })}
      </ul>
      <Button
        onClick={() => {
          const promise = mutateAsync(appName, {});

          toast.promise(
            promise,
            {
              error: "Failed to create API key",
              loading: "Creating API key...",
              success: "API key created",
            },
            { id: "api-key-create" }
          );
        }}
      >
        Create new
      </Button>
    </Container>
  );
}

export default AppPage;
