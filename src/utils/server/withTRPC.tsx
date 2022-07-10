import { createSSGHelpers } from "@trpc/react/ssg";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult
} from "next";
import superjson from "superjson";
import { db } from "~/server/db/client";
import { appRouter } from "~/server/router";

type SSGType = ReturnType<typeof createSSGHelpers<typeof appRouter>>

export function withTRPC(
  handler: ({
    ctx,
    ssg
  }: {
    ctx: GetServerSidePropsContext;
    ssg: SSGType
  }) => Promise<GetServerSidePropsResult<any>>
): GetServerSideProps {
  return async (ctx) => {
    const ssg = createSSGHelpers({
      router: appRouter,
      ctx: { req: ctx.req as any, res: ctx.res as any, db: db },
      transformer: superjson,
    });
    const res = await handler({ ctx, ssg });
    if ("props" in res) {
      return { 
        ...res, 
        props: {
          ...res.props,
          trpcState: ssg.dehydrate()
        } 
      };
    }
    return res;
  };
}
