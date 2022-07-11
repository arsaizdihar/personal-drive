import Error from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import Spinner from "~/components/Spinner";
import { uploadFile } from "~/utils/api/uploadFile";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const data = query.data;
  const path = paths.length > 0 ? paths.join("/") + "/" : "";

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
            <Button
              variant="danger"
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
          </li>
        ))}
        {files.map((file) => (
          <li key={file.name}>
            <a href={file.link} target="_blank" rel="noreferrer">
              {file.name}
            </a>
            <Button
              variant="danger"
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
      </ul>
      <Button
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
            query.refetch();
          });
        }}
      >
        <input type="file" ref={fileRef} />
        <Button type="submit">Upload</Button>
      </form>
      {progress !== undefined && (
        <div className="w-40 max-w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default AppPage;
