import Error from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import Button from "~/components/Button";
import Spinner from "~/components/Spinner";
import { trpc } from "~/utils/trpc";

function AppPage() {
  const router = useRouter();
  const slug = router.query.slug as string[];
  const appName = slug[0]!;
  const paths = slug.length > 1 ? slug.slice(1) : [];
  const utils = trpc.useContext();
  const query = trpc.useQuery(["drive.app.files", { name: appName, paths }]);
  const deleteApp = trpc.useMutation("drive.deleteApp", {
    onSuccess: () => {
      router.push("/");
    },
  });
  const createFolder = trpc.useMutation("drive.createFolder", {
    onSuccess: () => {
      utils.refetchQueries(["drive.app.files", { name: appName, paths }]);
    },
  });
  const data = query.data;

  if (query.error?.data?.httpStatus === 404)
    return <Error statusCode={404}></Error>;
  if (!data) return <Spinner className="fill-blue-600" />;
  const { app, folders, files } = data;
  return (
    <div className="max-w-screen-xl px-4 mx-auto my-4 prose prose-sky">
      <Link href={"/"}>Back</Link>
      <div className="flex flex-wrap">
        {slug.map((name, index) => (
          <React.Fragment key={index}>
            <Link
              href={{
                pathname: "/app/[...slug]",
                query: { slug: slug.slice(0, index + 1) },
              }}
            >
              {name}
            </Link>
            {index < slug.length - 1 && <span className="mx-2">/</span>}
          </React.Fragment>
        ))}
      </div>
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
      <ul>
        {folders.map((folder) => (
          <li key={folder}>
            <Link
              href={{
                pathname: "/app/[...slug]",
                query: { slug: [...slug, folder.slice(0, -1)] },
              }}
            >
              {folder}
            </Link>
          </li>
        ))}
        {files.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
      <Button
        onClick={() => {
          const name = prompt("Input folder name");
          if (name) {
            createFolder.mutate({
              appName,
              name,
              path: paths.length > 0 ? paths.join("/") + "/" : "",
            });
          }
        }}
      >
        Create folder
      </Button>
    </div>
  );
}

export default AppPage;
