import { useStreamLoader } from "../hooks/useStreamLoader";

const Page = () => {
  const { value, SSRStream, isPending, dispatch } = useStreamLoader(
    async (wait: number) => {
      await new Promise((r) => setTimeout(r, wait));
      return await fetch(`https://www.jma.go.jp/bosai/common/const/area.json`)
        .then((r) => r.json())
        .catch(() => null);
    },
    2000
  );
  return (
    <>
      <div>
        Source code:
        <a href="https://github.com/SoraKumo001/next-stream">
          https://github.com/SoraKumo001/next-stream
        </a>
      </div>
      <button onClick={() => dispatch(2000)}>Reload</button>
      <div>
        {isPending ? (
          "Loading"
        ) : (
          <pre>{JSON.stringify(value, undefined, "  ")}</pre>
        )}
      </div>
      {SSRStream}
    </>
  );
};

export default Page;
