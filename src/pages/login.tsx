import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";

function Login() {
  const { mutateAsync } = trpc.useMutation(["login"], { ssr: false });
  const router = useRouter();

  return (
    <button
      onClick={() => {
        mutateAsync({ password: "123" }).then((data) => {
          if (data) {
            router.push("/");
          }
        });
      }}
    >
      Login
    </button>
  );
}

export default Login;
