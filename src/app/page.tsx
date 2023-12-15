"use client";
import { useStreamLoader } from "../hooks/useStreamLoader";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Page = () => {
  const { value, SSRStream, isPending, dispatch } = useStreamLoader(
    async () => {
      // Streaming confirmation wait
      await sleep(2000);
      return fetch(`https://www.jma.go.jp/bosai/common/const/area.json`).then(
        async (r) => r.json()
      );
    }
  );

  return (
    <>
      <div>
        Source code:
        <a href="https://github.com/SoraKumo001/next-stream">
          https://github.com/SoraKumo001/next-stream
        </a>
      </div>
      <button onClick={() => dispatch()}>Reload</button>
      <div>
        {isPending ? (
          "Loading"
        ) : (
          <pre>{JSON.stringify(value, undefined, "  ")}</pre>
        )}
      </div>
      {/* Components for streaming */}
      <SSRStream />
    </>
  );
};

export default Page;

export const runtime = "edge";
