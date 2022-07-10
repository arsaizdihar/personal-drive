import Error from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";
import Button from "~/components/Button";
import Spinner from "~/components/Spinner";
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

  if (query.error?.data?.httpStatus === 404)
    return <Error statusCode={404}></Error>;
  if (!query.data) return <Spinner className="fill-blue-600" />;
  const app = query.data;
  return (
    <div className="max-w-screen-xl px-4 mx-auto my-4 prose prose-sky">
      <Link href={"/"}>Back</Link>
      <div className="flex items-center gap-4">
        <h1 className="my-0">{app.name}</h1>
        <Button
          variant="danger"
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
        <Link href={`/keys/${appName}`}>API keys</Link>
      </div>
    </div>
  );
}

export default AppPage;
