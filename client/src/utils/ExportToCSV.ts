export function exportToCSV<T extends Record<string, any>>(data: T[], filename = "export.csv") {
  if (!data.length) return;

  const keys = Object.keys(data[0]); // string[]
  const csvRows = [
    keys.join(","), // CSV header
    ...data.map(row =>
      keys.map(key => `"${String(row[key as keyof T]).replace(/"/g, '""')}"`).join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
