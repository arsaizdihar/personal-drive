import Error from "next/error";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import { trpc } from "~/utils/trpc";

function AppPage() {
  const router = useRouter();
  const appName = router.query.appName as string;
  const query = trpc.useQuery(["drive.app", appName]);
  const utils = trpc.useContext();
  const { mutate } = trpc.useMutation("drive.createApiKey", {
    onSuccess: (res) => {
      utils.setQueryData(["drive.app", appName], (data) => {
        if (!data) {
          return data as any;
        }
        return { ...data, apiKeys: [...data.apiKeys, res] };
      });
    },
  });
  const apiKeyDelete = trpc.useMutation("drive.deleteApiKey", {
    onSuccess(data, variables, context) {
      utils.setQueryData(["drive.app", appName], (data) => {
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

  if (query.status !== "success") return <Error statusCode={404}></Error>;
  const app = query.data;
  return (
    <div className="max-w-screen-xl px-4 mx-auto my-4 prose prose-sky">
      <h1>{app.name}</h1>
      <ul>
        {app.apiKeys.map((apiKey) => (
          <li key={apiKey.id}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiKey.key);
                toast.success("Copied to clipboard", { id: "api-key-copied" });
              }}
              className="my-0 hover:underline"
            >
              {apiKey.key}
            </button>
            <Button
              variant="danger"
              className="my-0 ml-4"
              onClick={() => {
                if (confirm("Are you sure?")) {
                  apiKeyDelete.mutate({ id: apiKey.id, appName });
                }
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => {
          mutate(appName, {});
        }}
      >
        Create new
      </Button>
    </div>
  );
}

export default AppPage;
