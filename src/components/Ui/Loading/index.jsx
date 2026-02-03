import "./Loading.scss";

const Loading = ({ size = 80, segments = 12 }) => {
  return (
    <div
      className="loader app-transition"
      style={{ width: size, height: size }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="loader-segment app-transition"
          style={{
            "--i": i,
            "--segments": segments
          }}
        />
      ))}
    </div>
  );
};

export default Loading;
