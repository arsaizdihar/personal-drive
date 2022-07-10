import type { NextPage } from "next";
import Link from "next/link";
import { useRef } from "react";
import Button from "~/components/Button";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const { data } = trpc.useQuery(["drive.appList"]);
  const utils = trpc.useContext();
  const createApp = trpc.useMutation("drive.createApp", {
    onSuccess: () => {
      utils.invalidateQueries(["drive.appList"]);
    },
  });
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-screen-xl px-4 mx-auto my-4 prose prose-sky">
      <h1>App list</h1>
      <ul>
        {data?.map((app) => (
          <li key={app.id}>
            <Link
              href={{
                pathname: "/app/[appName]",
                query: { appName: app.name },
              }}
            >
              {app.name}
            </Link>
          </li>
        ))}
      </ul>
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
        <input
          type="text"
          placeholder="App name"
          className="form-input"
          name="appName"
          ref={ref}
        />
        <Button>Create app</Button>
      </form>
    </div>
  );
};

export default Home;
