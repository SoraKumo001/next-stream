import { Suspense, useId, useRef, useState } from "react";

const isServer = typeof window === "undefined";

const StreamLoader = <T,>({
  loader: proc,
  onLoad,
}: {
  loader: () => Promise<T>;
  onLoad?: (value: T) => void;
}) => {
  const property = useRef<{ promise?: Promise<T>; value?: T }>({}).current;
  const id = useId();
  if (!isServer && property.value === undefined) {
    const node = document.getElementById(id);
    if (node) {
      property.value = JSON.parse(node.innerHTML);
      setTimeout(() => onLoad?.(property.value));
    }
  }
  if (property.value === undefined && !property.promise)
    property.promise = proc().then((v) => {
      property.value = v;
      onLoad?.(property.value);
      return v;
    });
  const Loader = () => {
    if (!property.value) throw property.promise;
    return (
      <script
        id={id}
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(property.value),
        }}
      />
    );
  };
  return (
    <Suspense>
      <Loader />
    </Suspense>
  );
};

const Page = () => {
  const [value, setvalue] = useState();
  const loader = async () => {
    const result = await fetch(
      `https://www.jma.go.jp/bosai/common/const/area.json`
    )
      .then((r) => r.json())
      .catch(() => null);
    await new Promise((r) => setTimeout(r, 3000));
    return result;
  };
  return (
    <>
      <div>
        Source code:
        <a href="https://github.com/SoraKumo001/next-stream">
          https://github.com/SoraKumo001/next-stream
        </a>
      </div>
      <div>
        {value === undefined ? (
          "Loading"
        ) : (
          <pre>{JSON.stringify(value, undefined, "  ")}</pre>
        )}
      </div>
      <StreamLoader loader={loader} onLoad={setvalue} />
    </>
  );
};

export default Page;
