type Fields = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, fields?: Fields) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    process.stderr.write(line + "\n");
    return;
  }
  process.stdout.write(line + "\n");
}

export const log = {
  info(message: string, fields?: Fields) {
    write("info", message, fields);
  },
  warn(message: string, fields?: Fields) {
    write("warn", message, fields);
  },
  error(message: string, fields?: Fields) {
    write("error", message, fields);
  },
};
